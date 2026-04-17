import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createAuditHash } from '@/lib/crypto/hash';

/**
 * POST /api/seed
 * Seeds the database with realistic Pakistani NGO demo data.
 * Creates NGOs, donations, expenses, and a valid hash chain.
 */
export async function POST() {
  try {
    // 1. Seed NGOs
    const ngos = [
      { name: 'Edhi Foundation', registration: 'SECP-2024-EDH-001', sector: 'health', admin_ratio: 8.50, verified: true },
      { name: 'Akhuwat Foundation', registration: 'SECP-2024-AKH-002', sector: 'education', admin_ratio: 5.20, verified: true },
      { name: 'SIUT Trust', registration: 'SECP-2024-SIT-003', sector: 'health', admin_ratio: 6.80, verified: true },
      { name: 'Saylani Welfare Trust', registration: 'SECP-2024-SAY-004', sector: 'food_security', admin_ratio: 10.30, verified: true },
      { name: 'Shaukat Khanum Memorial', registration: 'SECP-2024-SKM-005', sector: 'health', admin_ratio: 12.00, verified: true },
      { name: 'The Citizens Foundation', registration: 'SECP-2024-TCF-006', sector: 'education', admin_ratio: 7.40, verified: true },
      { name: 'Al-Khidmat Foundation', registration: 'SECP-2024-AKF-007', sector: 'disaster_relief', admin_ratio: 9.10, verified: true },
      { name: 'HANDS Pakistan', registration: 'SECP-2024-HND-008', sector: 'infrastructure', admin_ratio: 11.50, verified: true },
    ];

    const { data: ngoData, error: ngoError } = await supabaseAdmin
      .from('ngos')
      .upsert(ngos, { onConflict: 'registration' })
      .select();

    if (ngoError) {
      return NextResponse.json({ error: `NGO seed failed: ${ngoError.message}` }, { status: 500 });
    }

    const ngoMap = Object.fromEntries(ngoData!.map(n => [n.name, n.id]));

    // 2. Seed Donations
    const donorNames = [
      'Ahmed Khan', 'Fatima Zaidi', 'Hassan Ali', 'Ayesha Malik',
      'Usman Raza', 'Maryam Shah', 'Bilal Ahmed', 'Nadia Hussain',
      'Tariq Mehmood', 'Sana Iqbal', 'Anonymous', 'Imran Siddiqui',
      'Zainab Qureshi', 'Faisal Noor', 'Hina Parveen', 'Omar Farooq',
      'Rabia Khalid', 'Asad Ali', 'Saima Bibi', 'Kamran Shahid',
    ];

    const channels = ['raast', '1link', 'manual', 'bank_transfer'];
    const sectors = ['health', 'education', 'disaster_relief', 'infrastructure', 'food_security'];

    const donations = donorNames.map((name, i) => {
      const sector = sectors[i % sectors.length];
      const ngoNames = ngoData!.filter(n => n.sector === sector);
      const ngo = ngoNames.length > 0 ? ngoNames[0] : ngoData![0];

      return {
        donor_name: name,
        donor_id: `donor_${i + 1}_${Date.now()}`,
        amount: Math.round((Math.random() * 50000 + 1000) * 100), // 1K to 51K PKR in paisa
        channel: channels[i % channels.length],
        ngo_id: ngo.id,
        sector,
        status: 'confirmed',
        tx_ref: `SEED-DON-${Date.now()}-${i}`,
      };
    });

    const { data: donationData, error: donationError } = await supabaseAdmin
      .from('donations')
      .insert(donations)
      .select();

    if (donationError) {
      return NextResponse.json({ error: `Donation seed failed: ${donationError.message}` }, { status: 500 });
    }

    // 3. Seed Expenses
    const expenseTemplates = [
      { category: 'direct_aid', vendor_name: 'Pakistan Medical Supplies', description: 'Emergency medicine kits for flood victims' },
      { category: 'logistics', vendor_name: 'TCS Logistics', description: 'Shipment of relief supplies to Sindh' },
      { category: 'vendor_payment', vendor_name: 'Al-Noor Textiles', description: '500 blankets for winter relief' },
      { category: 'direct_aid', vendor_name: 'Karachi Medical Center', description: 'Free dialysis sessions — 200 patients' },
      { category: 'admin', vendor_name: 'Office Operations', description: 'Monthly operational costs' },
      { category: 'vendor_payment', vendor_name: 'National Book Foundation', description: 'Textbooks for 300 students' },
      { category: 'logistics', vendor_name: 'Daewoo Express', description: 'Transport volunteers to Balochistan' },
      { category: 'direct_aid', vendor_name: 'Punjab Food Bank', description: 'Ration packages — 1000 families' },
      { category: 'salary', vendor_name: 'Field Staff', description: 'Monthly salary for 15 field workers' },
      { category: 'vendor_payment', vendor_name: 'Hashoo Foundation', description: 'Clean water infrastructure materials' },
    ];

    const expenses = expenseTemplates.map((tmpl, i) => {
      const sector = sectors[i % sectors.length];
      const ngoNames = ngoData!.filter(n => n.sector === sector);
      const ngo = ngoNames.length > 0 ? ngoNames[0] : ngoData![0];

      return {
        ngo_id: ngo.id,
        amount: Math.round((Math.random() * 30000 + 500) * 100), // 500 to 30.5K PKR in paisa
        category: tmpl.category,
        vendor_name: tmpl.vendor_name,
        receipt_ref: `REC-${Date.now()}-${i}`,
        description: tmpl.description,
        sector,
        verified: true,
      };
    });

    const { data: expenseData, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert(expenses)
      .select();

    if (expenseError) {
      return NextResponse.json({ error: `Expense seed failed: ${expenseError.message}` }, { status: 500 });
    }

    // 4. Build hash chain for all seeded records
    let prevHash = 'GENESIS';
    const auditEntries = [];

    // Add donation audit entries
    for (const donation of donationData!) {
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

    // Add expense audit entries
    for (const expense of expenseData!) {
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

    const { error: auditError } = await supabaseAdmin
      .from('audit_log')
      .insert(auditEntries);

    if (auditError) {
      return NextResponse.json({ error: `Audit seed failed: ${auditError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      seeded: {
        ngos: ngoData!.length,
        donations: donationData!.length,
        expenses: expenseData!.length,
        audit_entries: auditEntries.length,
      },
      message: '🌱 Demo data seeded successfully with valid hash chain!',
    });

  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json(
      { error: 'Internal server error during seeding' },
      { status: 500 }
    );
  }
}
