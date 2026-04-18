import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ngos
 * Returns all verified NGOs — used by the NGO portal to populate the selector
 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('ngos')
    .select('id, name, sector, admin_ratio, verified')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
