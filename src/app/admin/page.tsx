'use client';

import { useState, useEffect } from 'react';
import { SECTOR_LABELS, CATEGORY_LABELS, formatPKR } from '@/lib/utils/format';

interface NGO {
  id: string;
  name: string;
  sector: string;
  admin_ratio: number;
  verified: boolean;
}

interface NGOBalance {
  total_donated: number;
  total_spent: number;
  balance: number;
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
  const [ngoBalance, setNgoBalance] = useState<NGOBalance | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<RecentExpense[]>([]);
  const [loadingNgos, setLoadingNgos] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'insufficient'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [auditHash, setAuditHash] = useState('');

  const [formData, setFormData] = useState({
    amount: '',
    category: 'direct_aid',
    vendor_name: '',
    receipt_ref: '',
    description: '',
  });

  // Load NGOs
  useEffect(() => {
    fetch('/api/ngos')
      .then(r => r.ok ? r.json() : [])
      .then((data: NGO[]) => {
        setNgos(data);
        if (data.length > 0) setSelectedNgo(data[0].id);
      })
      .finally(() => setLoadingNgos(false));
  }, []);

  // Load balance + expenses when NGO changes
  useEffect(() => {
    if (!selectedNgo) return;
    setLoadingBalance(true);
    Promise.all([
      fetch(`/api/ngos/${selectedNgo}/analytics`).then(r => r.ok ? r.json() : null),
      fetch(`/api/ngos/${selectedNgo}/expenses`).then(r => r.ok ? r.json() : []),
    ]).then(([analytics, expenses]) => {
      if (analytics) {
        setNgoBalance({
          total_donated: analytics.overview.total_donated,
          total_spent: analytics.overview.total_spent,
          balance: analytics.overview.balance,
        });
      }
      setRecentExpenses(expenses);
    }).finally(() => setLoadingBalance(false));
  }, [selectedNgo, submitStatus]);

  const selectedNgoData = ngos.find(n => n.id === selectedNgo);
  const requestedAmountPaisa = Number(formData.amount) * 100;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNgo || !selectedNgoData) return;

    setLoading(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const res = await fetch('/api/webhook/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: requestedAmountPaisa,
          ngo_id: selectedNgo,
          sector: selectedNgoData.sector,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuditHash(data.audit_hash || '');
        setSubmitStatus('success');
        setFormData({ amount: '', category: 'direct_aid', vendor_name: '', receipt_ref: '', description: '' });
        setTimeout(() => setSubmitStatus('idle'), 8000);
      } else if (res.status === 422) {
        setSubmitStatus('insufficient');
        setErrorMessage(data.detail || data.error || 'Insufficient balance.');
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

  const balanceAfterSubmit = ngoBalance ? ngoBalance.balance - requestedAmountPaisa : 0;
  const isOverspending = requestedAmountPaisa > 0 && ngoBalance && requestedAmountPaisa > ngoBalance.balance;

  return (
    <div className="bg-mesh min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-orange/10 text-accent-orange border border-accent-orange/20 text-xs font-mono mb-3">
            NGO ADMIN PORTAL
          </div>
          <h1 className="text-3xl font-bold mb-1">Record Verified Expense</h1>
          <p className="text-sm text-muted max-w-xl">
            Submit verified spending records for your organization. Each submission is cryptographically hashed and added to the public audit chain.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Form */}
          <div className="lg:col-span-2">
            <div className="glass-card p-6 sm:p-8">

              {/* NGO Selector */}
              <div className="mb-6 pb-6 border-b border-white/5">
                <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Your Organization</label>
                {loadingNgos ? (
                  <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
                ) : (
                  <select
                    value={selectedNgo}
                    onChange={(e) => setSelectedNgo(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                  >
                    {ngos.map(ngo => (
                      <option key={ngo.id} value={ngo.id}>{ngo.name}</option>
                    ))}
                  </select>
                )}

                {/* Live Balance Display */}
                {loadingBalance ? (
                  <div className="mt-3 h-16 bg-white/5 rounded-lg animate-pulse" />
                ) : ngoBalance !== null && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="bg-white/3 rounded-lg p-3 text-center border border-white/5">
                      <div className="text-xs text-muted mb-1">Total Received</div>
                      <div className="text-sm font-semibold text-accent-green">{formatPKR(ngoBalance.total_donated)}</div>
                    </div>
                    <div className="bg-white/3 rounded-lg p-3 text-center border border-white/5">
                      <div className="text-xs text-muted mb-1">Total Spent</div>
                      <div className="text-sm font-semibold text-accent-orange">{formatPKR(ngoBalance.total_spent)}</div>
                    </div>
                    <div className={`rounded-lg p-3 text-center border ${ngoBalance.balance >= 0 ? 'bg-accent-green/5 border-accent-green/20' : 'bg-red-500/5 border-red-500/20'}`}>
                      <div className="text-xs text-muted mb-1">Available Balance</div>
                      <div className={`text-sm font-bold ${ngoBalance.balance >= 0 ? 'text-accent-green' : 'text-red-400'}`}>
                        {formatPKR(ngoBalance.balance)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Expense Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Amount (PKR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium text-sm">Rs</span>
                      <input
                        required min="1" type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className={`w-full bg-black/20 border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all ${
                          isOverspending ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-accent-orange'
                        }`}
                        placeholder="15,000"
                      />
                    </div>
                    {/* Real-time balance preview */}
                    {formData.amount && ngoBalance && (
                      <div className={`text-xs mt-1.5 ${isOverspending ? 'text-red-400' : 'text-accent-green'}`}>
                        {isOverspending
                          ? `Exceeds balance by ${formatPKR(requestedAmountPaisa - ngoBalance.balance)}`
                          : `Balance after submission: ${formatPKR(balanceAfterSubmit)}`}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Expense Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Vendor / Payee Name</label>
                    <input
                      required type="text"
                      value={formData.vendor_name}
                      onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                      placeholder="ABC Medical Supply"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-1.5">Receipt / Invoice Reference</label>
                    <input
                      required type="text"
                      value={formData.receipt_ref}
                      onChange={(e) => setFormData({ ...formData, receipt_ref: e.target.value })}
                      className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                      placeholder="INV-2026-001"
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
                    placeholder="Describe what this expense was for..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || loadingNgos || ngos.length === 0 || !!isOverspending}
                  className="w-full bg-gradient-to-r from-accent-orange to-orange-600 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Recording to Audit Chain...</>
                  ) : 'Submit & Hash to Audit Chain'}
                </button>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4">
                    <p className="text-sm text-green-400 font-semibold mb-2">Expense Successfully Recorded</p>
                    {auditHash && (
                      <div>
                        <p className="text-xs text-muted mb-1">SHA-256 Audit Hash:</p>
                        <p className="font-mono text-xs text-accent-green/80 break-all">{auditHash}</p>
                      </div>
                    )}
                  </div>
                )}
                {submitStatus === 'insufficient' && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                    <p className="text-sm text-red-400 font-semibold mb-1">Insufficient Balance</p>
                    <p className="text-xs text-muted">{errorMessage}</p>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <p className="text-center text-sm text-red-400">Submission failed. Check all fields and try again.</p>
                )}
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Recent Expenses */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Recent Expenses</h3>
              {recentExpenses.length === 0 ? (
                <p className="text-xs text-muted">No expenses recorded for this organization yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentExpenses.slice(0, 6).map(exp => (
                    <div key={exp.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground/80">{CATEGORY_LABELS[exp.category] || exp.category}</span>
                        <span className="font-mono text-accent-orange">-{formatPKR(exp.amount)}</span>
                      </div>
                      <p className="text-xs text-muted mt-0.5 truncate">{exp.vendor_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Webhook Reference Docs */}
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Beeceptor Webhook Format</h3>
              <p className="text-xs text-muted mb-2">Send a POST request to trigger a donation:</p>
              <div className="bg-black/30 rounded-lg p-3 font-mono text-xs text-accent-green/80 mb-3 break-all">
                POST whitebox-test-123456.free.beeceptor.com/api/webhook/donation
              </div>
              <p className="text-xs text-muted mb-2">Required JSON body:</p>
              <pre className="bg-black/30 rounded-lg p-3 text-xs text-foreground/60 overflow-x-auto">{`{
  "donor_id": "42201-XXXXXXX-X",
  "amount": 5000000,
  "sector": "health",
  "donor_name": "Ahmed Khan",
  "channel": "raast",
  "tx_ref": "RAAST-001"
}`}</pre>
              <p className="text-xs text-muted mt-2">
                <strong className="text-foreground/50">amount</strong> is in paisa. 5000000 = Rs 50,000
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
