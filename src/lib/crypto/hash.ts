/**
 * SHA-256 Hashing Utilities for White Box Audit Chain
 * Uses Web Crypto API (available in Node.js 18+ and all modern browsers)
 */

/**
 * Compute SHA-256 hash of a string, returns hex digest
 */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sort object keys recursively for canonical JSON representation.
 * This ensures the same data always produces the same hash regardless of key order.
 */
function sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = typeof obj[key] === 'object' && obj[key] !== null
      ? sortKeys(obj[key] as Record<string, unknown>)
      : obj[key];
  }
  return sorted;
}

/**
 * Build the audit payload and compute its hash.
 * The hash chain works by including the previous hash in the payload.
 */
export async function createAuditHash(params: {
  prevHash: string;
  eventType: string;
  refId: string;
  refTable: string;
  amount: number;
  actorId: string;
}): Promise<{ hash: string; payload: Record<string, unknown> }> {
  const payload = sortKeys({
    prev_hash: params.prevHash,
    event_type: params.eventType,
    ref_id: params.refId,
    ref_table: params.refTable,
    amount: params.amount,
    actor_id: params.actorId,
    timestamp: new Date().toISOString(),
  });

  const canonicalJson = JSON.stringify(payload);
  const hash = await sha256(canonicalJson);

  return { hash, payload };
}

/**
 * Verify a single audit entry against its stored payload.
 * Recomputes the hash from raw_payload and compares.
 */
export async function verifyAuditEntry(rawPayload: Record<string, unknown>, storedHash: string): Promise<boolean> {
  const canonical = JSON.stringify(sortKeys(rawPayload));
  const recomputed = await sha256(canonical);
  return recomputed === storedHash;
}
