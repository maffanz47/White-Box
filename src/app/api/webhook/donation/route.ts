import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createAuditHash } from '@/lib/crypto/hash';

/**
 * POST /api/webhook/donation
 * Receives mock 1Link/Raast donation payloads and creates:
 * 1. A donation record
 * 2. An audit_log entry with hash chain
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { donor_name, donor_id, amount, sector, ngo_id, channel, tx_ref } = body;

    if (!donor_id || !amount || !sector) {
      return NextResponse.json(
        { error: 'Missing required fields: donor_id, amount, sector' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive (in paisa)' },
        { status: 400, headers: corsHeaders }
      );
    }

    const validSectors = ['health', 'education', 'disaster_relief', 'infrastructure', 'food_security'];
    if (!validSectors.includes(sector)) {
      return NextResponse.json(
        { error: `Invalid sector. Must be one of: ${validSectors.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Insert donation
    const { data: donation, error: donationError } = await supabaseAdmin
      .from('donations')
      .insert({
        donor_name: donor_name || 'Anonymous',
        donor_id,
        amount: Math.round(amount),
        channel: channel || 'manual',
        ngo_id: ngo_id || null,
        sector,
        status: 'confirmed',
        tx_ref: tx_ref || `WB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      })
      .select()
      .single();

    if (donationError) {
      console.error('Donation insert error:', donationError);
      return NextResponse.json({ error: donationError.message }, { status: 500, headers: corsHeaders });
    }

    // 2. Get previous hash for chain
    const { data: lastAudit } = await supabaseAdmin
      .from('audit_log')
      .select('payload_hash')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    const prevHash = lastAudit?.payload_hash || 'GENESIS';

    // 3. Create audit hash
    const { hash, payload } = await createAuditHash({
      prevHash,
      eventType: 'donation',
      refId: donation.id,
      refTable: 'donations',
      amount: donation.amount,
      actorId: donor_id,
    });

    // 4. Insert audit log
    const { error: auditError } = await supabaseAdmin
      .from('audit_log')
      .insert({
        event_type: 'donation',
        ref_id: donation.id,
        ref_table: 'donations',
        actor_id: donor_id,
        payload_hash: hash,
        prev_hash: prevHash,
        raw_payload: payload,
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the donation — log the audit error
    }

    return NextResponse.json({
      success: true,
      donation_id: donation.id,
      amount: donation.amount,
      audit_hash: hash,
      chain_link: prevHash === 'GENESIS' ? 'GENESIS (first entry)' : `linked to ${prevHash.slice(0, 12)}...`,
    }, { status: 201, headers: corsHeaders });

  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
