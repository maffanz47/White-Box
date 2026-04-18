import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/totals
 * Returns live donation/expense totals via server-side Supabase (bypasses client-side RLS 401).
 * The LiveCounter can call this endpoint instead of querying Supabase directly from the browser.
 */
export async function GET() {
  try {
    const [donationsResult, expensesResult] = await Promise.all([
      supabaseAdmin
        .from('donations')
        .select('amount')
        .eq('status', 'confirmed'),
      supabaseAdmin
        .from('expenses')
        .select('amount')
        .eq('verified', true),
    ]);

    const total_donated = (donationsResult.data || []).reduce((sum, d) => sum + d.amount, 0);
    const total_spent = (expensesResult.data || []).reduce((sum, e) => sum + e.amount, 0);
    const donation_count = (donationsResult.data || []).length;
    const expense_count = (expensesResult.data || []).length;

    return NextResponse.json({
      total_donated,
      total_spent,
      donation_count,
      expense_count,
      balance: total_donated - total_spent,
    });
  } catch (err) {
    console.error('Totals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
