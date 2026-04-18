import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ngos/[id]/analytics
 * Returns per-NGO analytics: donations received, expenses, balance, breakdown
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [ngoResult, donationsResult, expensesResult] = await Promise.all([
      supabaseAdmin.from('ngos').select('*').eq('id', id).single(),
      supabaseAdmin.from('donations').select('amount, sector, channel, donor_name, created_at').eq('ngo_id', id).eq('status', 'confirmed'),
      supabaseAdmin.from('expenses').select('amount, category, vendor_name, description, created_at').eq('ngo_id', id).eq('verified', true),
    ]);

    if (ngoResult.error || !ngoResult.data) {
      return NextResponse.json({ error: 'NGO not found' }, { status: 404 });
    }

    const ngo = ngoResult.data;
    const donations = donationsResult.data || [];
    const expenses = expensesResult.data || [];

    const total_donated = donations.reduce((s, d) => s + d.amount, 0);
    const total_spent = expenses.reduce((s, e) => s + e.amount, 0);
    const balance = total_donated - total_spent;

    // Sector breakdown of donations received by this NGO
    const sectorMap: Record<string, number> = {};
    donations.forEach(d => {
      sectorMap[d.sector] = (sectorMap[d.sector] || 0) + d.amount;
    });

    // Category breakdown of expenses
    const categoryMap: Record<string, number> = {};
    expenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    const efficiency_grade = ngo.admin_ratio <= 7 ? 'A' : ngo.admin_ratio <= 12 ? 'B' : ngo.admin_ratio <= 20 ? 'C' : 'D';

    return NextResponse.json({
      ngo: {
        id: ngo.id,
        name: ngo.name,
        sector: ngo.sector,
        admin_ratio: ngo.admin_ratio,
        verified: ngo.verified,
        efficiency_grade,
      },
      overview: {
        total_donated,
        total_spent,
        balance,
        donation_count: donations.length,
        expense_count: expenses.length,
        utilization_rate: total_donated > 0 ? Math.round((total_spent / total_donated) * 100) : 0,
      },
      sector_breakdown: Object.entries(sectorMap).map(([sector, amount]) => ({ sector, amount })),
      category_breakdown: Object.entries(categoryMap).map(([category, amount]) => ({ category, amount })),
      recent_donations: donations
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
      recent_expenses: expenses
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    });
  } catch (err) {
    console.error('NGO analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
