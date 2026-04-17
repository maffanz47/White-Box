import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createAuditHash } from '@/lib/crypto/hash';

/**
 * POST /api/webhook/expense
 * Records an NGO expense and creates an audit trail entry
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
      return NextResponse.json(
        { error: 'Amount must be positive (in paisa)' },
        { status: 400 }
      );
    }

    const validCategories = ['direct_aid', 'logistics', 'admin', 'vendor_payment', 'salary'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // 1. Insert expense
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
        verified: true, // Auto-verify for demo
      })
      .select()
      .single();

    if (expenseError) {
      console.error('Expense insert error:', expenseError);
      return NextResponse.json({ error: expenseError.message }, { status: 500 });
    }

    // 2. Get previous hash
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
      eventType: 'expense',
      refId: expense.id,
      refTable: 'expenses',
      amount: expense.amount,
      actorId: ngo_id,
    });

    // 4. Insert audit log
    const { error: auditError } = await supabaseAdmin
      .from('audit_log')
      .insert({
        event_type: 'expense',
        ref_id: expense.id,
        ref_table: 'expenses',
        actor_id: ngo_id,
        payload_hash: hash,
        prev_hash: prevHash,
        raw_payload: payload,
      });

    if (auditError) {
      console.error('Audit log error:', auditError);
    }

    return NextResponse.json({
      success: true,
      expense_id: expense.id,
      amount: expense.amount,
      audit_hash: hash,
    }, { status: 201 });

  } catch (err) {
    console.error('Expense webhook error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
