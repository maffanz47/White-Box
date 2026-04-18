import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createAuditHash } from '@/lib/crypto/hash';

/**
 * POST /api/reset
 * Clears all donations, expenses, and audit_log entries.
 * Preserves NGOs. Then re-seeds with balanced, consistent data.
 * Use only for demo/hackathon purposes.
 */
export async function POST() {
  try {
    // 1. Clear transactional data (keep NGOs intact)
    await supabaseAdmin.from('audit_log').delete().gte('id', 0);
    await supabaseAdmin.from('expenses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabaseAdmin.from('donations').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Fetch existing NGOs
    const { data: ngos, error: ngoErr } = await supabaseAdmin
      .from('ngos')
      .select('*')
      .eq('verified', true)
      .order('name');

    if (ngoErr || !ngos || ngos.length === 0) {
      return NextResponse.json({ error: 'No NGOs found. Run /api/seed first.' }, { status: 400 });
    }

    // 3. Build per-NGO balanced donations → then expenses at ~40-60% of donated
    const donationRecords: Record<string, unknown>[] = [];
    const expenseRecords: Record<string, unknown>[] = [];
    const channels = ['raast', '1link', 'manual', 'bank_transfer'];
    const donorNames = [
      'Ahmed Khan', 'Fatima Zaidi', 'Hassan Ali', 'Ayesha Malik',
      'Usman Raza', 'Maryam Shah', 'Bilal Ahmed', 'Nadia Hussain',
      'Tariq Mehmood', 'Sana Iqbal', 'Anonymous', 'Imran Siddiqui',
      'Zainab Qureshi', 'Faisal Noor', 'Hina Parveen', 'Omar Farooq',
    ];

    const expenseTemplates = [
      { category: 'direct_aid', vendor_name: 'Pakistan Medical Supplies', description: 'Emergency medicine kits for flood victims' },
      { category: 'logistics', vendor_name: 'TCS Logistics', description: 'Shipment of relief supplies to Sindh' },
      { category: 'vendor_payment', vendor_name: 'Al-Noor Textiles', description: '500 blankets for winter relief' },
      { category: 'admin', vendor_name: 'Office Operations', description: 'Monthly operational costs' },
      { category: 'salary', vendor_name: 'Field Staff', description: 'Monthly salary for field workers' },
    ];

    // Give each NGO 2-3 donations and 1-2 expenses that don't exceed donations
    let donorIdx = 0;
    const ngoTargets: { ngoId: string; sector: string; totalDonated: number }[] = [];

    for (const ngo of ngos) {
      const numDonations = 2 + (ngos.indexOf(ngo) % 2); // 2 or 3
      let totalForNgo = 0;

      for (let i = 0; i < numDonations; i++) {
        const amount = Math.round((20000 + Math.random() * 30000) * 100); // 20K-50K PKR in paisa
        totalForNgo += amount;
        donationRecords.push({
          donor_name: donorNames[donorIdx % donorNames.length],
          donor_id: `donor_${donorIdx + 1}`,
          amount,
          channel: channels[donorIdx % channels.length],
          ngo_id: ngo.id,
          sector: ngo.sector,
          status: 'confirmed',
          tx_ref: `RESET-DON-${Date.now()}-${donorIdx}`,
        });
        donorIdx++;
      }

      ngoTargets.push({ ngoId: ngo.id, sector: ngo.sector, totalDonated: totalForNgo });
    }

    // Insert all donations first
    const { data: insertedDonations, error: donErr } = await supabaseAdmin
      .from('donations')
      .insert(donationRecords)
      .select();

    if (donErr) return NextResponse.json({ error: `Donation insert failed: ${donErr.message}` }, { status: 500 });

    // Now build expenses that never exceed the NGO's received amount
    for (const target of ngoTargets) {
      const maxSpend = Math.round(target.totalDonated * 0.55); // spend ~55% of what was received
      const numExpenses = 1 + (ngoTargets.indexOf(target) % 2); // 1 or 2 expenses
      const amountEach = Math.round(maxSpend / numExpenses);

      for (let i = 0; i < numExpenses; i++) {
        const tmpl = expenseTemplates[i % expenseTemplates.length];
        expenseRecords.push({
          ngo_id: target.ngoId,
          amount: amountEach,
          category: tmpl.category,
          vendor_name: tmpl.vendor_name,
          receipt_ref: `REC-RESET-${Date.now()}-${i}`,
          description: tmpl.description,
          sector: target.sector,
          verified: true,
        });
      }
    }

    const { data: insertedExpenses, error: expErr } = await supabaseAdmin
      .from('expenses')
      .insert(expenseRecords)
      .select();

    if (expErr) return NextResponse.json({ error: `Expense insert failed: ${expErr.message}` }, { status: 500 });

    // 4. Build valid hash chain for all records
    let prevHash = 'GENESIS';
    const auditEntries = [];

    for (const donation of insertedDonations!) {
      const { hash, payload } = await createAuditHash({
        prevHash,
        eventType: 'donation',
        refId: donation.id,
        refTable: 'donations',
        amount: donation.amount,
        actorId: donation.donor_id,
      });
      auditEntries.push({
        event_type: 'donation',
        ref_id: donation.id,
        ref_table: 'donations',
        actor_id: donation.donor_id,
        payload_hash: hash,
        prev_hash: prevHash,
        raw_payload: payload,
      });
      prevHash = hash;
    }

    for (const expense of insertedExpenses!) {
      const { hash, payload } = await createAuditHash({
        prevHash,
        eventType: 'expense',
        refId: expense.id,
        refTable: 'expenses',
        amount: expense.amount,
        actorId: expense.ngo_id,
      });
      auditEntries.push({
        event_type: 'expense',
        ref_id: expense.id,
        ref_table: 'expenses',
        actor_id: expense.ngo_id,
        payload_hash: hash,
        prev_hash: prevHash,
        raw_payload: payload,
      });
      prevHash = hash;
    }

    const { error: auditErr } = await supabaseAdmin.from('audit_log').insert(auditEntries);
    if (auditErr) return NextResponse.json({ error: `Audit insert failed: ${auditErr.message}` }, { status: 500 });

    return NextResponse.json({
      success: true,
      message: 'Database reset and re-seeded with balanced, consistent data.',
      stats: {
        ngos: ngos.length,
        donations: insertedDonations!.length,
        expenses: insertedExpenses!.length,
        audit_blocks: auditEntries.length,
      },
    });
  } catch (err) {
    console.error('Reset error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
