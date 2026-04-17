import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sha256 } from '@/lib/crypto/hash';

/**
 * GET /api/audit/verify
 * Reads the entire audit_log chain and verifies integrity.
 * If any record has been tampered with, the chain breaks.
 */
export async function GET() {
  try {
    const { data: auditEntries, error } = await supabaseAdmin
      .from('audit_log')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!auditEntries || auditEntries.length === 0) {
      return NextResponse.json({
        valid: true,
        chain_length: 0,
        message: 'No audit entries to verify',
      });
    }

    const results: {
      id: number;
      event_type: string;
      valid: boolean;
      hash_match: boolean;
      chain_link_valid: boolean;
    }[] = [];

    let chainValid = true;
    let brokenAt: number | null = null;

    for (let i = 0; i < auditEntries.length; i++) {
      const entry = auditEntries[i];

      // 1. Verify the hash matches the raw_payload
      function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(obj).sort()) {
          sorted[key] = typeof obj[key] === 'object' && obj[key] !== null
            ? sortKeys(obj[key] as Record<string, unknown>)
            : obj[key];
        }
        return sorted;
      }

      const canonical = JSON.stringify(sortKeys(entry.raw_payload));
      const recomputedHash = await sha256(canonical);
      const hashMatch = recomputedHash === entry.payload_hash;

      // 2. Verify the chain link (prev_hash matches previous entry's hash)
      let chainLinkValid = true;
      if (i === 0) {
        chainLinkValid = entry.prev_hash === 'GENESIS';
      } else {
        chainLinkValid = entry.prev_hash === auditEntries[i - 1].payload_hash;
      }

      const entryValid = hashMatch && chainLinkValid;
      if (!entryValid && chainValid) {
        chainValid = false;
        brokenAt = entry.id;
      }

      results.push({
        id: entry.id,
        event_type: entry.event_type,
        valid: entryValid,
        hash_match: hashMatch,
        chain_link_valid: chainLinkValid,
      });
    }

    return NextResponse.json({
      valid: chainValid,
      chain_length: auditEntries.length,
      broken_at: brokenAt,
      message: chainValid
        ? `✅ All ${auditEntries.length} entries verified — chain integrity intact`
        : `❌ Chain broken at entry #${brokenAt} — possible tampering detected`,
      entries: results,
    });

  } catch (err) {
    console.error('Verification error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
