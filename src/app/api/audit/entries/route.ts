import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/audit/entries
 * Server-side audit log fetch — bypasses client RLS issues
 */
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_log')
      .select('*')
      .order('id', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Audit entries error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
