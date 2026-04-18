import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/flow
 * Returns Sankey flow data: Donations Pool -> NGOs -> Expense Categories
 * Uses server-side admin client to bypass RLS issues.
 */
export async function GET() {
  try {
    const [donationsResult, ngosResult, expensesResult] = await Promise.all([
      supabaseAdmin.from('donations').select('ngo_id, amount, sector').eq('status', 'confirmed'),
      supabaseAdmin.from('ngos').select('id, name, sector').eq('verified', true),
      supabaseAdmin.from('expenses').select('ngo_id, amount, category').eq('verified', true),
    ]);

    const donations = donationsResult.data || [];
    const ngos = ngosResult.data || [];
    const expenses = expensesResult.data || [];

    if (donations.length === 0 && expenses.length === 0) {
      return NextResponse.json({ nodes: [], links: [], empty: true });
    }

    // Build node list: [0] = Donations Pool, [1..N] = NGOs, [N+1..] = Categories
    const nodeNames: string[] = ['Donations Pool'];
    const ngoNodeMap: Record<string, number> = {};
    const categoryNodeMap: Record<string, number> = {};

    // Add NGOs that actually have donations or expenses
    const activeNgoIds = new Set([
      ...donations.filter(d => d.ngo_id).map(d => d.ngo_id),
      ...expenses.filter(e => e.ngo_id).map(e => e.ngo_id),
    ]);

    ngos
      .filter(n => activeNgoIds.has(n.id))
      .forEach(ngo => {
        ngoNodeMap[ngo.id] = nodeNames.length;
        nodeNames.push(ngo.name);
      });

    // Add only categories that have actual expenses
    const activeCategories = [...new Set(expenses.map(e => e.category))];
    const categoryDisplay: Record<string, string> = {
      direct_aid: 'Direct Aid',
      logistics: 'Logistics',
      admin: 'Admin',
      vendor_payment: 'Vendor Payment',
      salary: 'Salary',
    };
    activeCategories.forEach(cat => {
      categoryNodeMap[cat] = nodeNames.length;
      nodeNames.push(categoryDisplay[cat] || cat);
    });

    // Build links
    const links: { source: number; target: number; value: number }[] = [];

    // Pool -> NGOs
    const ngoTotals: Record<string, number> = {};
    donations.forEach(d => {
      if (d.ngo_id && ngoNodeMap[d.ngo_id] !== undefined) {
        ngoTotals[d.ngo_id] = (ngoTotals[d.ngo_id] || 0) + d.amount;
      }
    });
    Object.entries(ngoTotals).forEach(([ngoId, total]) => {
      if (total > 0) {
        links.push({ source: 0, target: ngoNodeMap[ngoId], value: Math.round(total / 100) });
      }
    });

    // NGOs -> Categories
    const ngoCatTotals: Record<string, Record<string, number>> = {};
    expenses.forEach(e => {
      if (ngoNodeMap[e.ngo_id] !== undefined && categoryNodeMap[e.category] !== undefined) {
        if (!ngoCatTotals[e.ngo_id]) ngoCatTotals[e.ngo_id] = {};
        ngoCatTotals[e.ngo_id][e.category] = (ngoCatTotals[e.ngo_id][e.category] || 0) + e.amount;
      }
    });
    Object.entries(ngoCatTotals).forEach(([ngoId, cats]) => {
      Object.entries(cats).forEach(([cat, total]) => {
        if (total > 0) {
          links.push({ source: ngoNodeMap[ngoId], target: categoryNodeMap[cat], value: Math.round(total / 100) });
        }
      });
    });

    return NextResponse.json({
      nodes: nodeNames.map(name => ({ name })),
      links,
      empty: links.length === 0,
    });
  } catch (err) {
    console.error('Flow API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
