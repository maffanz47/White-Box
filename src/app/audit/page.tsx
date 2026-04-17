'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { truncateHash, timeAgo } from '@/lib/utils/format';

interface AuditEntry {
  id: number;
  event_type: string;
  ref_id: string;
  ref_table: string;
  actor_id: string;
  payload_hash: string;
  prev_hash: string;
  raw_payload: Record<string, unknown>;
  created_at: string;
}

interface VerificationResult {
  valid: boolean;
  chain_length: number;
  broken_at: number | null;
  message: string;
  entries: {
    id: number;
    event_type: string;
    valid: boolean;
    hash_match: boolean;
    chain_link_valid: boolean;
  }[];
}

export default function AuditPage() {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);

  useEffect(() => {
    async function fetchAuditLog() {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('id', { ascending: false })
        .limit(50);

      if (!error && data) {
        setAuditEntries(data);
      }
      setLoading(false);
    }

    fetchAuditLog();
  }, []);

  async function verifyChain() {
    setVerifying(true);
    try {
      const res = await fetch('/api/audit/verify');
      const data = await res.json();
      setVerification(data);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  }

  // Map entry ID to verification status
  const verificationMap = new Map(
    verification?.entries?.map(e => [e.id, e]) || []
  );

  return (
    <div className="bg-mesh min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Audit Trail</h1>
            <p className="text-sm text-muted">
              SHA-256 hash chain — every transaction is cryptographically linked
            </p>
          </div>
          <button
            onClick={verifyChain}
            disabled={verifying}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-green to-accent-blue text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {verifying ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </>
            ) : (
              <>🔍 Verify Chain Integrity</>
            )}
          </button>
        </div>

        {/* Verification Result Banner */}
        {verification && (
          <div className={`rounded-xl p-5 mb-6 border ${
            verification.valid
              ? 'bg-green-500/5 border-green-500/20'
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {verification.valid ? '✅' : '❌'}
              </span>
              <div>
                <div className={`font-semibold text-lg ${
                  verification.valid ? 'text-green-400' : 'text-red-400'
                }`}>
                  {verification.valid ? 'Chain Integrity Verified' : 'Chain Integrity Compromised'}
                </div>
                <p className="text-sm text-muted mt-0.5">{verification.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs font-mono text-muted">
              <span>Chain Length: {verification.chain_length}</span>
              {verification.broken_at && (
                <span className="text-red-400">Broken at: #{verification.broken_at}</span>
              )}
            </div>
          </div>
        )}

        {/* How It Works Card */}
        <div className="glass-card p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl">🔗</div>
            <div>
              <h3 className="text-sm font-semibold mb-1">How the Hash Chain Works</h3>
              <p className="text-xs text-muted leading-relaxed">
                Each entry stores the SHA-256 hash of its data <strong>combined with the previous entry&apos;s hash</strong>. 
                This creates an unbreakable chain: tampering with any single record changes its hash, which invalidates 
                all subsequent hashes. Click &quot;Verify Chain Integrity&quot; to re-compute every hash and confirm nothing has been altered.
              </p>
            </div>
          </div>
        </div>

        {/* Chain Visualization */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted-bg rounded-xl animate-pulse" />
            ))}
          </div>
        ) : auditEntries.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-semibold mb-1">No Audit Entries Yet</h3>
            <p className="text-sm text-muted">
              Seed the database or send a webhook to create the first hash chain entry.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {auditEntries.map((entry, index) => {
              const vStatus = verificationMap.get(entry.id);
              const isExpanded = expandedEntry === entry.id;
              const isVerified = vStatus?.valid;
              const isBroken = vStatus && !vStatus.valid;

              return (
                <div key={entry.id}>
                  {/* Chain Link */}
                  {index > 0 && (
                    <div className="flex justify-center">
                      <div className={`hash-chain-link ${isBroken ? '!bg-gradient-to-b from-red-500/60 to-red-500/10' : ''}`} />
                    </div>
                  )}

                  {/* Block */}
                  <div
                    className={`hash-block p-5 cursor-pointer ${
                      isVerified ? 'verified' : isBroken ? 'broken' : ''
                    }`}
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                          isVerified ? 'bg-green-500/10 text-green-400' :
                          isBroken ? 'bg-red-500/10 text-red-400' :
                          'bg-white/5 text-muted'
                        }`}>
                          {isVerified ? '✓' : isBroken ? '✗' : '#'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              Block #{entry.id}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                              entry.event_type === 'donation'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-orange-500/10 text-orange-400'
                            }`}>
                              {entry.event_type}
                            </span>
                          </div>
                          <div className="text-xs text-muted mt-0.5 font-mono">
                            {truncateHash(entry.payload_hash, 12)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-xs text-muted">
                        <div>{timeAgo(entry.created_at)}</div>
                        <div className="font-mono mt-0.5">
                          prev: {entry.prev_hash === 'GENESIS' ? 'GENESIS' : truncateHash(entry.prev_hash, 8)}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Payload */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="text-xs font-mono text-muted mb-2">RAW PAYLOAD (hashed data)</div>
                        <pre className="text-xs font-mono text-accent-green/80 bg-black/30 rounded-lg p-4 overflow-x-auto">
                          {JSON.stringify(entry.raw_payload, null, 2)}
                        </pre>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                          <div>
                            <span className="text-muted">Full Hash: </span>
                            <span className="font-mono text-foreground/70 break-all">{entry.payload_hash}</span>
                          </div>
                          <div>
                            <span className="text-muted">Previous Hash: </span>
                            <span className="font-mono text-foreground/70 break-all">{entry.prev_hash}</span>
                          </div>
                        </div>
                        {vStatus && (
                          <div className="mt-3 flex gap-4 text-xs">
                            <span className={vStatus.hash_match ? 'text-green-400' : 'text-red-400'}>
                              Hash Match: {vStatus.hash_match ? '✓ Yes' : '✗ No'}
                            </span>
                            <span className={vStatus.chain_link_valid ? 'text-green-400' : 'text-red-400'}>
                              Chain Link: {vStatus.chain_link_valid ? '✓ Valid' : '✗ Broken'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
