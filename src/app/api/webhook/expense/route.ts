import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createAuditHash } from '@/lib/crypto/hash';

/**
 * POST /api/webhook/expense
 * Records an NGO expense with a balance check — NGO cannot spend more than it has received.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ngo_id, amount, category, vendor_name, receipt_ref, description, sector } = body;

    if (!ngo_id || !amount || !category || !sector) {
      return NextResponse.json(
        { error: 'Missing required fields: ngo_id, amount, category, sector' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    const validCategories = ['direct_aid', 'logistics', 'admin', 'vendor_payment', 'salary'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // ============================================================
    // BALANCE CHECK: NGO cannot spend more than it has received
    // ============================================================
    const [donationsResult, expensesResult] = await Promise.all([
      supabaseAdmin
        .from('donations')
        .select('amount')
        .eq('ngo_id', ngo_id)
        .eq('status', 'confirmed'),
      supabaseAdmin
        .from('expenses')
        .select('amount')
        .eq('ngo_id', ngo_id)
        .eq('verified', true),
    ]);

    const totalReceived = (donationsResult.data || []).reduce((s, d) => s + d.amount, 0);
    const totalSpent = (expensesResult.data || []).reduce((s, e) => s + e.amount, 0);
    const availableBalance = totalReceived - totalSpent;

    if (amount > availableBalance) {
      return NextResponse.json(
        {
          error: 'Insufficient balance',
          detail: `This NGO has only PKR ${(availableBalance / 100).toLocaleString()} available. Cannot record PKR ${(amount / 100).toLocaleString()} in spending.`,
          available_balance: availableBalance,
          requested_amount: amount,
        },
        { status: 422 }
      );
    }

    // Insert expense
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert({
        ngo_id,
        amount: Math.round(amount),
        category,
        vendor_name: vendor_name || null,
        receipt_ref: receipt_ref || null,
        description: description || null,
        sector,
        verified: true,
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Expense insert error:', expenseError);
      return NextResponse.json({ error: expenseError.message }, { status: 500 });
    }

    // Get previous hash for chain
    const { data: lastAudit } = await supabaseAdmin
      .from('audit_log')
      .select('payload_hash')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    const prevHash = lastAudit?.payload_hash || 'GENESIS';

    // Create audit hash
    const { hash, payload } = await createAuditHash({
      prevHash,
      eventType: 'expense',
      refId: expense.id,
      refTable: 'expenses',
      amount: expense.amount,
      actorId: ngo_id,
    });

    // Insert audit log
    await supabaseAdmin.from('audit_log').insert({
      event_type: 'expense',
      ref_id: expense.id,
      ref_table: 'expenses',
      actor_id: ngo_id,
      payload_hash: hash,
      prev_hash: prevHash,
      raw_payload: payload,
    });

    return NextResponse.json({
      success: true,
      expense_id: expense.id,
      amount: expense.amount,
      audit_hash: hash,
      remaining_balance: availableBalance - amount,
    }, { status: 201 });

  } catch (err) {
    console.error('Expense webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
