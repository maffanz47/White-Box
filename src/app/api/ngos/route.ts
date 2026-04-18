import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

/**
 * GET /api/ngos
 * Returns all verified NGOs — used by the NGO portal and bank simulator
 */
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('ngos')
    .select('id, name, sector, admin_ratio, verified')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors });
  }

  return NextResponse.json(data || [], { headers: cors });
}
