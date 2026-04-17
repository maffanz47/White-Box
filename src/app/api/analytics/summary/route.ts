import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/analytics/summary
 * Returns sector breakdown, funding gaps, and NGO efficiency data
 */
export async function GET() {
  try {
    // 1. Sector-wise donation breakdown
    const { data: donations } = await supabaseAdmin
      .from('donations')
      .select('sector, amount')
      .eq('status', 'confirmed');

    const { data: expenses } = await supabaseAdmin
      .from('expenses')
      .select('sector, amount, category')
      .eq('verified', true);

    const { data: ngos } = await supabaseAdmin
      .from('ngos')
      .select('*')
      .eq('verified', true);

    // Sector aggregations
    const sectors = ['health', 'education', 'disaster_relief', 'infrastructure', 'food_security'];
    const sectorBreakdown = sectors.map(sector => {
      const sectorDonations = (donations || []).filter(d => d.sector === sector);
      const sectorExpenses = (expenses || []).filter(e => e.sector === sector);
      const totalDonated = sectorDonations.reduce((sum, d) => sum + d.amount, 0);
      const totalSpent = sectorExpenses.reduce((sum, e) => sum + e.amount, 0);

      return {
        sector,
        total_donated: totalDonated,
        total_spent: totalSpent,
        balance: totalDonated - totalSpent,
        donation_count: sectorDonations.length,
        expense_count: sectorExpenses.length,
        utilization_rate: totalDonated > 0 ? Math.round((totalSpent / totalDonated) * 100) : 0,
      };
    });

    // Funding gap alerts (sectors where balance is below 20% of donations)
    const fundingGaps = sectorBreakdown
      .filter(s => {
        if (s.total_donated === 0) return true; // No funding at all
        return s.balance < s.total_donated * 0.2; // Less than 20% remaining
      })
      .map(s => ({
        sector: s.sector,
        severity: s.total_donated === 0 ? 'critical' : s.utilization_rate > 90 ? 'high' : 'medium',
        message: s.total_donated === 0
          ? `${s.sector} has received zero donations — urgent need`
          : `${s.sector} is ${s.utilization_rate}% utilized — running low`,
        remaining: s.balance,
      }));

    // NGO efficiency ratios
    const ngoEfficiency = (ngos || []).map(ngo => {
      const ngoExpenses = (expenses || []).filter(e => {
        // We need to compare through the expenses table
        return true; // We'll use admin_ratio from the NGO itself
      });

      return {
        id: ngo.id,
        name: ngo.name,
        sector: ngo.sector,
        admin_ratio: ngo.admin_ratio,
        efficiency_grade: ngo.admin_ratio <= 7 ? 'A' : ngo.admin_ratio <= 12 ? 'B' : ngo.admin_ratio <= 20 ? 'C' : 'D',
        verified: ngo.verified,
      };
    });

    // Expense category breakdown
    const categoryBreakdown = ['direct_aid', 'logistics', 'admin', 'vendor_payment', 'salary'].map(cat => {
      const catExpenses = (expenses || []).filter(e => e.category === cat);
      return {
        category: cat,
        total: catExpenses.reduce((sum, e) => sum + e.amount, 0),
        count: catExpenses.length,
      };
    });

    // Overall totals
    const totalDonated = (donations || []).reduce((sum, d) => sum + d.amount, 0);
    const totalSpent = (expenses || []).reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      overview: {
        total_donated: totalDonated,
        total_spent: totalSpent,
        balance: totalDonated - totalSpent,
        donation_count: (donations || []).length,
        expense_count: (expenses || []).length,
        ngo_count: (ngos || []).length,
        transparency_score: Math.min(100, Math.round((totalSpent / Math.max(totalDonated, 1)) * 100)),
      },
      sector_breakdown: sectorBreakdown,
      funding_gaps: fundingGaps,
      ngo_efficiency: ngoEfficiency,
      category_breakdown: categoryBreakdown,
    });

  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
