'use client';

import { useState } from 'react';
import { SECTOR_LABELS } from '@/lib/utils/format';

export default function DonatePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hash, setHash] = useState('');

  const [formData, setFormData] = useState({
    donor_name: '',
    donor_id: '',
    amount: '',
    sector: 'health',
    channel: 'manual',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/webhook/donation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount) * 100, // Convert to paisa
          tx_ref: `DON-${Date.now()}`, // Generate mock ref
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setHash(data.audit_hash);
      }
    } catch (error) {
      console.error('Donation error:', error);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-mesh min-h-screen flex items-center justify-center py-12 px-4">
        <div className="glass-card max-w-md w-full p-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            ✅
          </div>
          <h2 className="text-2xl font-bold mb-2">Donation Recorded</h2>
          <p className="text-muted text-sm mb-6">
            Your donation has been added to the public pool and logged in the immutable audit chain.
          </p>
          <div className="bg-black/30 rounded-lg p-4 mb-6">
            <div className="text-xs text-muted mb-1">Your Cryptographic Hash Receipt:</div>
            <div className="font-mono text-accent-green text-xs break-all">{hash}</div>
          </div>
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({ ...formData, amount: '' });
            }}
            className="text-sm font-semibold text-accent-blue hover:text-accent-blue/80"
          >
            Make another donation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-mesh min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Make a Donation</h1>
          <p className="text-muted text-sm">
            Simulate a manual bank transfer. Every donation is publicly trackable.
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Full Name</label>
                <input
                  required
                  type="text"
                  value={formData.donor_name}
                  onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                  placeholder="Ahmed Khan"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">CNIC / ID</label>
                <input
                  required
                  type="text"
                  value={formData.donor_id}
                  onChange={(e) => setFormData({ ...formData, donor_id: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                  placeholder="42201-XXXXXXX-X"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Amount (PKR)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">₨</span>
                <input
                  required
                  type="number"
                  min="100"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent-green focus:ring-1 focus:ring-accent-green transition-all"
                  placeholder="5000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Target Sector</label>
                <select
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue transition-all"
                >
                  {Object.entries(SECTOR_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Payment Channel</label>
                <select
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue transition-all"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="raast">Raast P2M</option>
                  <option value="1link">1Link</option>
                  <option value="manual">Cash / Manual</option>
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-accent-green to-accent-blue text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Hash...
                  </>
                ) : (
                  'Confirm & Record Hash'
                )}
              </button>
              <p className="text-center text-xs text-muted mt-3 flex items-center justify-center gap-1">
                <span>🔒</span> Secured by SHA-256 Audit Trail
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
