'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { SECTOR_LABELS, CATEGORY_LABELS, formatPKR } from '@/lib/utils/format';

// We fetch NGOs via our own API to avoid client-side RLS issues
interface NGO {
  id: string;
  name: string;
  sector: string;
}

interface RecentExpense {
  id: string;
  amount: number;
  category: string;
  vendor_name: string;
  description: string;
  created_at: string;
}

export default function NGOPortalPage() {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedNgo, setSelectedNgo] = useState<string>('');
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingNgos, setFetchingNgos] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [auditHash, setAuditHash] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    category: 'direct_aid',
    vendor_name: '',
    receipt_ref: '',
    description: '',
  });

  // Fetch NGOs via our own API (bypasses client-side RLS)
  useEffect(() => {
    async function fetchNgos() {
      try {
        const res = await fetch('/api/ngos');
        if (res.ok) {
          const data = await res.json();
          setNgos(data);
          if (data.length > 0) setSelectedNgo(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch NGOs:', err);
      } finally {
        setFetchingNgos(false);
      }
    }
    fetchNgos();
  }, []);

  // Fetch recent expenses for selected NGO
  useEffect(() => {
    if (!selectedNgo) return;
    async function fetchExpenses() {
      const res = await fetch(`/api/ngos/${selectedNgo}/expenses`);
      if (res.ok) setRecentExpenses(await res.json());
    }
    fetchExpenses();
  }, [selectedNgo, submitStatus]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNgo) return;
    setLoading(true);
    setSubmitStatus('idle');

    const ngo = ngos.find(n => n.id === selectedNgo);

    try {
      const res = await fetch('/api/webhook/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Math.round(Number(formData.amount) * 100), // rupees → paisa
          ngo_id: selectedNgo,
          sector: ngo?.sector,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAuditHash(data.audit_hash || '');
        setSubmitStatus('success');
        setFormData({ amount: '', category: 'direct_aid', vendor_name: '', receipt_ref: '', description: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Expense submit error:', err);
      setSubmitStatus('error');
    } finally {
      setLoading(false);
    }
  }

  const selectedNgoData = ngos.find(n => n.id === selectedNgo);

  return (
    <div className="bg-mesh min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-orange/10 text-accent-orange border border-accent-orange/20 text-xs font-mono mb-3">
            🔐 NGO ADMIN PORTAL
          </div>
          <h1 className="text-3xl font-bold mb-1">Record Verified Expense</h1>
          <p className="text-sm text-muted max-w-2xl">
            Submit spending records for your organization. Every expense is automatically hashed and added to the public audit chain.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 sm:p-8">
              {/* NGO Selector */}
              <div className="mb-6 pb-6 border-b border-white/5">
                <label className="block text-xs font-medium text-muted mb-2 uppercase tracking-wider">Select Your Organization</label>
                {fetchingNgos ? (
                  <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
                ) : (
                  <select
                    value={selectedNgo}
                    onChange={(e) => setSelectedNgo(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
                  >
                    {ngos.map(ngo => (
                      <option key={ngo.id} value={ngo.id}>
                        {ngo.name} — {SECTOR_LABELS[ngo.sector]?.replace(/^\S+\s/, '') || ngo.sector}
                      </option>
                    ))}
                  </select>
                )}
                {selectedNgoData && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-accent-green">
                    <span>✓ Verified NGO</span>
                    <span className="text-muted">·</span>
                    <span className="text-muted">{SECTOR_LABELS[selectedNgoData.sector]}</span>
                  </div>
                )}
              </div>

              {/* Expense Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Amount Spent (PKR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium text-sm">₨</span>
                      <input
                        required min="1" type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                        placeholder="15,000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Expense Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Vendor / Payee</label>
                    <input
                      required type="text"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                      placeholder="e.g. ABC Medical Supply"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Receipt / Invoice Ref</label>
                    <input
                      required type="text"
                      value={formData.receipt_ref}
                      onChange={(e) => setFormData({ ...formData, receipt_ref: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                      placeholder="INV-2026-04-001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Description</label>
                  <textarea
                    required rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all resize-none"
                    placeholder="Briefly describe what this money was spent on..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || fetchingNgos || ngos.length === 0}
                  className="w-full bg-gradient-to-r from-accent-orange to-red-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Recording to Audit Trail...</>
                  ) : '🔐 Submit & Hash to Audit Chain'}
                </button>

                {submitStatus === 'success' && (
                  <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                    <p className="text-sm text-green-400 font-semibold mb-1">✅ Expense Successfully Recorded!</p>
                    {auditHash && (
                      <div>
                        <p className="text-xs text-muted mb-1">SHA-256 Audit Hash:</p>
                        <p className="font-mono text-xs text-accent-green/80 break-all">{auditHash}</p>
                      </div>
                    )}
                  </div>
                )}
                {submitStatus === 'error' && (
                  <p className="text-center text-sm text-red-400">❌ Submission failed. Please check all fields and try again.</p>
                )}
              </form>
            </div>
          </div>

          {/* Sidebar: Recent Expenses + Webhook Docs */}
          <div className="space-y-6">
            {/* Recent Expenses for this NGO */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3">Recent Expenses</h3>
              {recentExpenses.length === 0 ? (
                <p className="text-xs text-muted">No expenses recorded yet for this NGO.</p>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.slice(0, 5).map(exp => (
                    <div key={exp.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{CATEGORY_LABELS[exp.category] || exp.category}</span>
                        <span className="font-mono text-accent-orange">-{formatPKR(exp.amount)}</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5 truncate">{exp.vendor_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Webhook Reference */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">📡 Beeceptor Webhook Format</h3>
              <p className="text-xs text-muted mb-3">To trigger a donation via the Beeceptor mock bank, send a POST to:</p>
              <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-accent-green mb-3 break-all">
                POST whitebox-test-123456.free.beeceptor.com/api/webhook/donation
              </div>
              <p className="text-xs text-muted mb-2">Required JSON body:</p>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-foreground/70 overflow-x-auto">{`{
  "donor_id": "42201-XXXXXXX-X",
  "amount": 5000000,
  "sector": "health",
  "donor_name": "Ahmed Khan",
  "channel": "raast",
  "tx_ref": "RAAST-001"
}`}</pre>
              <p className="text-xs text-muted mt-2">
                <strong className="text-foreground/60">amount</strong> is in paisa. 5000000 = ₨50,000<br/>
                <strong className="text-foreground/60">sector</strong>: health, education, disaster_relief, infrastructure, food_security
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
