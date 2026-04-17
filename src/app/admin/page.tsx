'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SECTOR_LABELS, CATEGORY_LABELS } from '@/lib/utils/format';

interface NGO {
  id: string;
  name: string;
  sector: string;
}

export default function AdminPage() {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedNgo, setSelectedNgo] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    category: 'direct_aid',
    vendor_name: '',
    receipt_ref: '',
    description: '',
  });

  // Fetch NGOs for the dropdown (since we don't have actual login for demo)
  useEffect(() => {
    async function fetchNgos() {
      const { data } = await supabase.from('ngos').select('id, name, sector').order('name');
      if (data) {
        setNgos(data);
        if (data.length > 0) setSelectedNgo(data[0].id);
      }
    }
    fetchNgos();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedNgo) return;
    setLoading(true);
    setSuccess(false);

    const ngo = ngos.find(n => n.id === selectedNgo);

    try {
      const res = await fetch('/api/webhook/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount) * 100, // Convert to paisa
          ngo_id: selectedNgo,
          sector: ngo?.sector, // Pull sector from NGO
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({
          amount: '',
          category: 'direct_aid',
          vendor_name: '',
          receipt_ref: '',
          description: '',
        });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Expense error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-mesh min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-orange/10 text-accent-orange border border-accent-orange/20 text-xs font-mono mb-4">
            NGO PORTAL
          </div>
          <h1 className="text-3xl font-bold mb-2">Record Verified Expense</h1>
          <p className="text-muted text-sm">
            Upload spending receipts to update the live transparency dashboard.
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NGO Selector (Demo Login Bypass) */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Select your NGO (Demo purposes)</label>
              <select
                value={selectedNgo}
                onChange={(e) => setSelectedNgo(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange focus:ring-1 focus:ring-accent-orange transition-all"
              >
                {ngos.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>{ngo.name} ({SECTOR_LABELS[ngo.sector]})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Amount Spent (PKR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">₨</span>
                  <input
                    required
                    type="number"
                    min="10"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                    placeholder="15000"
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
                  required
                  type="text"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                  placeholder="e.g. ABC Medical Supply"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Receipt Reference</label>
                <input
                  required
                  type="text"
                  value={formData.receipt_ref}
                  onChange={(e) => setFormData({ ...formData, receipt_ref: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
                  placeholder="INV-2026-04"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Description</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all resize-none"
                placeholder="What was this money spent on?"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || ngos.length === 0}
                className="w-full bg-gradient-to-r from-accent-orange to-red-500 text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Recording to Audit Trail...' : 'Submit Verified Expense'}
              </button>
              
              {success && (
                <p className="text-center text-sm text-accent-green mt-3 font-medium">
                  ✅ Expense successfully recorded & hashed!
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
