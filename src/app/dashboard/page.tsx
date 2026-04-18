'use client';

import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { formatPKR, SECTOR_LABELS, SECTOR_COLORS, CATEGORY_LABELS } from '@/lib/utils/format';
import LiveCounter from '@/components/LiveCounter';

interface NGO {
  id: string;
  name: string;
  sector: string;
}

interface NGOAnalytics {
  ngo: {
    id: string;
    name: string;
    sector: string;
    admin_ratio: number;
    verified: boolean;
    efficiency_grade: string;
  };
  overview: {
    total_donated: number;
    total_spent: number;
    balance: number;
    donation_count: number;
    expense_count: number;
    utilization_rate: number;
  };
  sector_breakdown: { sector: string; amount: number }[];
  category_breakdown: { category: string; amount: number }[];
  recent_donations: { amount: number; sector: string; channel: string; donor_name: string; created_at: string }[];
  recent_expenses: { amount: number; category: string; vendor_name: string; description: string; created_at: string }[];
}

const GRADE_STYLES: Record<string, string> = {
  A: 'text-green-400 bg-green-400/10 border-green-400/30',
  B: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  C: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  D: 'text-red-400 bg-red-400/10 border-red-400/30',
};

const CATEGORY_COLORS: Record<string, string> = {
  direct_aid: '#10b981',
  logistics: '#3b82f6',
  admin: '#ef4444',
  vendor_payment: '#f59e0b',
  salary: '#8b5cf6',
};

function NGOCard({ data }: { data: NGOAnalytics }) {
  const sectorPie = data.sector_breakdown.map(s => ({
    name: SECTOR_LABELS[s.sector]?.replace(/^\S+\s/, '') || s.sector,
    value: s.amount,
    fill: SECTOR_COLORS[s.sector] || '#6b7280',
  }));

  const categoryBar = data.category_breakdown.map(c => ({
    name: CATEGORY_LABELS[c.category] || c.category,
    value: c.amount,
    fill: CATEGORY_COLORS[c.category] || '#6b7280',
  }));

  return (
    <div className="space-y-4">
      {/* NGO Header */}
      <div className="glass-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-base">{data.ngo.name}</h3>
            <p className="text-xs text-muted mt-0.5">
              {SECTOR_LABELS[data.ngo.sector]?.replace(/^\S+\s/, '') || data.ngo.sector}
              {data.ngo.verified && <span className="text-accent-green ml-2">Verified</span>}
            </p>
          </div>
          <div className={`px-2 py-1 rounded border text-xs font-bold ${GRADE_STYLES[data.ngo.efficiency_grade] || 'text-muted'}`}>
            Grade {data.ngo.efficiency_grade}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/3 rounded-lg p-3 text-center">
            <div className="text-xs text-muted mb-1">Total Received</div>
            <div className="font-bold text-accent-green text-sm">{formatPKR(data.overview.total_donated)}</div>
            <div className="text-xs text-muted">{data.overview.donation_count} donations</div>
          </div>
          <div className="bg-white/3 rounded-lg p-3 text-center">
            <div className="text-xs text-muted mb-1">Total Spent</div>
            <div className="font-bold text-accent-orange text-sm">{formatPKR(data.overview.total_spent)}</div>
            <div className="text-xs text-muted">{data.overview.expense_count} expenses</div>
          </div>
          <div className="bg-white/3 rounded-lg p-3 text-center">
            <div className="text-xs text-muted mb-1">Available Balance</div>
            <div className={`font-bold text-sm ${data.overview.balance >= 0 ? 'text-accent-blue' : 'text-red-400'}`}>
              {formatPKR(Math.abs(data.overview.balance))}
            </div>
          </div>
          <div className="bg-white/3 rounded-lg p-3 text-center">
            <div className="text-xs text-muted mb-1">Utilization</div>
            <div className={`font-bold text-sm ${
              data.overview.utilization_rate > 70 ? 'text-accent-green' :
              data.overview.utilization_rate > 40 ? 'text-accent-orange' : 'text-accent-blue'
            }`}>
              {data.overview.utilization_rate}%
            </div>
          </div>
        </div>
      </div>

      {/* Sector breakdown */}
      {sectorPie.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Donations by Sector</h4>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sectorPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                {sectorPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f9fafb', fontSize: '11px' }}
                formatter={(value) => [formatPKR(Number(value)), 'Amount']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-1 justify-center">
            {sectorPie.map((s, i) => (
              <div key={i} className="flex items-center gap-1 text-xs text-muted">
                <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: s.fill }} />
                {s.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense category breakdown */}
      {categoryBar.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Spending by Category</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={categoryBar} layout="vertical" margin={{ left: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} width={70} />
              <Tooltip
                contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f9fafb', fontSize: '11px' }}
                formatter={(value) => [formatPKR(Number(value)), 'Spent']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {categoryBar.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent activity */}
      {(data.recent_donations.length > 0 || data.recent_expenses.length > 0) && (
        <div className="glass-card p-4">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {data.recent_donations.slice(0, 3).map((d, i) => (
              <div key={`d-${i}`} className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                <div>
                  <span className="text-accent-green font-medium">+{formatPKR(d.amount)}</span>
                  <span className="text-muted ml-2">Donation — {SECTOR_LABELS[d.sector]?.replace(/^\S+\s/, '') || d.sector}</span>
                </div>
                <span className="text-muted/60 text-xs">{d.channel}</span>
              </div>
            ))}
            {data.recent_expenses.slice(0, 3).map((e, i) => (
              <div key={`e-${i}`} className="flex items-center justify-between text-xs border-b border-white/5 pb-2 last:border-0">
                <div>
                  <span className="text-accent-orange font-medium">-{formatPKR(e.amount)}</span>
                  <span className="text-muted ml-2">{CATEGORY_LABELS[e.category] || e.category}</span>
                </div>
                <span className="text-muted/60 text-xs truncate max-w-[80px]">{e.vendor_name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DonorPortalPage() {
  const [ngos, setNgos] = useState<NGO[]>([]);
  const [selectedNgo1, setSelectedNgo1] = useState<string>('');
  const [selectedNgo2, setSelectedNgo2] = useState<string>('');
  const [analytics1, setAnalytics1] = useState<NGOAnalytics | null>(null);
  const [analytics2, setAnalytics2] = useState<NGOAnalytics | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  // Load NGO list
  useEffect(() => {
    async function fetchNgos() {
      const res = await fetch('/api/ngos');
      if (res.ok) {
        const data: NGO[] = await res.json();
        setNgos(data);
        if (data.length > 0) setSelectedNgo1(data[0].id);
        if (data.length > 1) setSelectedNgo2(data[1].id);
      }
    }
    fetchNgos();
  }, []);

  // Fetch analytics for NGO 1
  useEffect(() => {
    if (!selectedNgo1) return;
    setLoading1(true);
    fetch(`/api/ngos/${selectedNgo1}/analytics`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setAnalytics1(data); setLoading1(false); })
      .catch(() => setLoading1(false));
  }, [selectedNgo1]);

  // Fetch analytics for NGO 2
  useEffect(() => {
    if (!selectedNgo2 || !compareMode) return;
    setLoading2(true);
    fetch(`/api/ngos/${selectedNgo2}/analytics`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setAnalytics2(data); setLoading2(false); })
      .catch(() => setLoading2(false));
  }, [selectedNgo2, compareMode]);

  return (
    <div className="bg-mesh min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-xs font-mono mb-3">
            DONOR TRANSPARENCY PORTAL
          </div>
          <h1 className="text-3xl font-bold mb-1">Where Is Your Money Going?</h1>
          <p className="text-sm text-muted max-w-2xl">
            Every rupee is tracked with cryptographic proof. Select an organization below to see exactly how your donations are being received and spent.
          </p>
        </div>

        {/* Live Counter */}
        <div className="mb-10">
          <LiveCounter />
        </div>

        {/* Beeceptor Banner */}
        <div className="glass-card p-4 mb-8 border border-accent-green/20 bg-accent-green/5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-accent-green">Live Webhook Integration Active</div>
              <p className="text-xs text-muted mt-0.5">
                Donations are received via <span className="font-mono text-accent-green/80">whitebox-test-123456.free.beeceptor.com</span> forwarding to <span className="font-mono text-accent-green/80">/api/webhook/donation</span>
              </p>
            </div>
            <span className="text-xs font-mono text-accent-green shrink-0">LIVE</span>
          </div>
        </div>

        {/* NGO Selector + Compare Toggle */}
        <div className="flex items-end gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Select Organization</label>
            <select
              value={selectedNgo1}
              onChange={(e) => setSelectedNgo1(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-blue transition-all"
            >
              {ngos.map(n => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </div>
          {compareMode && (
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-muted mb-1.5 uppercase tracking-wider">Compare With</label>
              <select
                value={selectedNgo2}
                onChange={(e) => setSelectedNgo2(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent-orange transition-all"
              >
                {ngos.filter(n => n.id !== selectedNgo1).map(n => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
              compareMode
                ? 'bg-accent-orange/10 border-accent-orange/30 text-accent-orange'
                : 'bg-white/5 border-white/10 text-muted hover:text-foreground hover:border-white/20'
            }`}
          >
            {compareMode ? 'Exit Comparison' : 'Compare Two NGOs'}
          </button>
        </div>

        {/* Analytics Content */}
        <div className={`grid gap-6 ${compareMode ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
          {/* NGO 1 */}
          <div>
            {loading1 ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
              </div>
            ) : analytics1 ? (
              <NGOCard data={analytics1} />
            ) : (
              <div className="glass-card p-8 text-center text-sm text-muted">
                {ngos.length === 0 ? 'No organizations found. Seed the database first.' : 'Select an organization to view its analytics.'}
              </div>
            )}
          </div>

          {/* NGO 2 (Compare) */}
          {compareMode && (
            <div>
              {loading2 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
              ) : analytics2 ? (
                <NGOCard data={analytics2} />
              ) : (
                <div className="glass-card p-8 text-center text-sm text-muted">Select a second organization to compare.</div>
              )}
            </div>
          )}
        </div>

        {/* Audit Trail CTA */}
        <div className="mt-8 glass-card p-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Cryptographic Audit Trail</div>
            <p className="text-xs text-muted mt-0.5">Every transaction is hashed and publicly verifiable. Click to inspect the full chain.</p>
          </div>
          <a
            href="/audit"
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-accent-green/20 text-accent-green hover:bg-accent-green/5 transition-colors"
          >
            View Audit Chain
          </a>
        </div>
      </div>
    </div>
  );
}
