'use client';

import { useEffect, useState } from 'react';
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
  const [filter, setFilter] = useState<'all' | 'donation' | 'expense'>('all');

  useEffect(() => {
    async function fetchAuditLog() {
      try {
        // Use server-side API instead of client-side Supabase (avoids RLS 401)
        const res = await fetch('/api/audit/entries');
        if (res.ok) {
          const data = await res.json();
          setAuditEntries(data);
        }
      } catch (err) {
        console.error('Failed to fetch audit entries:', err);
      } finally {
        setLoading(false);
      }
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

  const verificationMap = new Map(
    verification?.entries?.map(e => [e.id, e]) || []
  );

  const filteredEntries = auditEntries.filter(e =>
    filter === 'all' ? true : e.event_type === filter
  );

  const donationCount = auditEntries.filter(e => e.event_type === 'donation').length;
  const expenseCount = auditEntries.filter(e => e.event_type === 'expense').length;

  return (
    <div className="bg-mesh min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">Audit Trail</h1>
            <p className="text-sm text-muted">
              SHA-256 hash chain — every transaction is cryptographically linked and tamper-evident
            </p>
          </div>
          <button
            onClick={verifyChain}
            disabled={verifying || auditEntries.length === 0}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent-green to-accent-blue text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {verifying ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
            ) : 'Verify Chain Integrity'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{auditEntries.length}</div>
            <div className="text-xs text-muted mt-1">Total Entries</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-green">{donationCount}</div>
            <div className="text-xs text-muted mt-1">Donation Events</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-accent-orange">{expenseCount}</div>
            <div className="text-xs text-muted mt-1">Expense Events</div>
          </div>
        </div>

        {/* Verification Result Banner */}
        {verification && (
          <div className={`rounded-xl p-4 mb-6 border ${
            verification.valid
              ? 'bg-green-500/5 border-green-500/20'
              : 'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                verification.valid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {verification.valid ? '✓' : '✗'}
              </div>
              <div>
                <div className={`font-semibold ${verification.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {verification.valid ? 'Chain Integrity Verified' : 'Chain Integrity Compromised'}
                </div>
                <p className="text-xs text-muted mt-0.5">{verification.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs font-mono text-muted">
              <span>Chain length: {verification.chain_length} blocks</span>
              {verification.broken_at && (
                <span className="text-red-400">Broken at block #{verification.broken_at}</span>
              )}
            </div>
          </div>
        )}

        {/* How It Works Card */}
        <div className="glass-card p-5 mb-6">
          <div>
            <h3 className="text-sm font-semibold mb-1">How the Hash Chain Works</h3>
            <p className="text-xs text-muted leading-relaxed">
              Each block stores the SHA-256 hash of its own data combined with the previous block&apos;s hash.
              This makes tampering cryptographically impossible: changing any single record changes its hash,
              which breaks the link to every block after it. The entire chain can be publicly re-verified at any time.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'donation', 'expense'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-white/10 text-foreground'
                  : 'text-muted hover:text-foreground hover:bg-white/5'
              }`}
            >
              {f === 'all' ? `All (${auditEntries.length})` : f === 'donation' ? `Donations (${donationCount})` : `Expenses (${expenseCount})`}
            </button>
          ))}
        </div>

        {/* Chain Visualization */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <span className="text-muted text-xl font-mono">#</span>
            </div>
            <h3 className="text-sm font-semibold mb-1">No Audit Entries Yet</h3>
            <p className="text-xs text-muted">
              Send a donation via the bank simulator or submit an expense from the NGO portal to generate the first hash block.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {filteredEntries.map((entry, index) => {
              const vStatus = verificationMap.get(entry.id);
              const isExpanded = expandedEntry === entry.id;
              const isVerified = vStatus?.valid;
              const isBroken = vStatus && !vStatus.valid;

              return (
                <div key={entry.id}>
                  {/* Chain Connector */}
                  {index > 0 && (
                    <div className="flex justify-center">
                      <div className={`hash-chain-link ${isBroken ? '!bg-gradient-to-b from-red-500/60 to-red-500/10' : ''}`} />
                    </div>
                  )}

                  {/* Block */}
                  <div
                    className={`hash-block p-5 cursor-pointer ${isVerified ? 'verified' : isBroken ? 'broken' : ''}`}
                    onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Block Status */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-mono font-bold ${
                          isVerified ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          isBroken ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-white/5 text-muted border border-white/5'
                        }`}>
                          {isVerified ? '✓' : isBroken ? '✗' : '#'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Block #{entry.id}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-mono uppercase tracking-wider ${
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
                        <div className="font-mono mt-0.5 text-muted/60">
                          prev: {entry.prev_hash === 'GENESIS' ? 'GENESIS' : truncateHash(entry.prev_hash, 8)}
                        </div>
                        <div className="text-muted/40 mt-0.5">
                          {isExpanded ? 'collapse' : 'expand'}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Payload */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="text-xs font-mono text-muted mb-2 uppercase tracking-wider">Raw Payload (hashed data)</div>
                        <pre className="text-xs font-mono text-accent-green/80 bg-black/30 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(entry.raw_payload, null, 2)}
                        </pre>
                        <div className="grid grid-cols-1 gap-3 mt-3 text-xs">
                          <div>
                            <span className="text-muted block mb-1">Current Hash:</span>
                            <span className="font-mono text-foreground/70 break-all">{entry.payload_hash}</span>
                          </div>
                          <div>
                            <span className="text-muted block mb-1">Previous Hash:</span>
                            <span className="font-mono text-foreground/70 break-all">{entry.prev_hash}</span>
                          </div>
                        </div>
                        {vStatus && (
                          <div className="mt-3 flex gap-4 text-xs">
                            <span className={vStatus.hash_match ? 'text-green-400' : 'text-red-400'}>
                              Hash Match: {vStatus.hash_match ? 'Yes' : 'No'}
                            </span>
                            <span className={vStatus.chain_link_valid ? 'text-green-400' : 'text-red-400'}>
                              Chain Link: {vStatus.chain_link_valid ? 'Valid' : 'Broken'}
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
