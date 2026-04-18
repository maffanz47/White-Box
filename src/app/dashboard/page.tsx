'use client';

import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';
import { formatPKR, SECTOR_LABELS, SECTOR_COLORS, CHANNEL_LABELS } from '@/lib/utils/format';
import LiveCounter from '@/components/LiveCounter';
import FundingGapAlert from '@/components/FundingGapAlert';

interface AnalyticsData {
  overview: {
    total_donated: number;
    total_spent: number;
    balance: number;
    donation_count: number;
    expense_count: number;
    ngo_count: number;
    transparency_score: number;
  };
  sector_breakdown: {
    sector: string;
    total_donated: number;
    total_spent: number;
    balance: number;
    donation_count: number;
    utilization_rate: number;
  }[];
  ngo_efficiency: {
    id: string;
    name: string;
    sector: string;
    admin_ratio: number;
    efficiency_grade: string;
    verified: boolean;
  }[];
  category_breakdown: {
    category: string;
    total: number;
    count: number;
  }[];
}

const GRADE_COLORS: Record<string, string> = {
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

const CATEGORY_DISPLAY: Record<string, string> = {
  direct_aid: 'Direct Aid',
  logistics: 'Logistics',
  admin: 'Admin',
  vendor_payment: 'Vendor',
  salary: 'Salary',
};

export default function DonorPortalPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/summary');
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        setData(await res.json());
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError('Could not load analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const sectorPieData = (data?.sector_breakdown || [])
    .filter(s => s.total_donated > 0)
    .map(s => ({
      name: SECTOR_LABELS[s.sector]?.replace(/^\S+\s/, '') || s.sector,
      value: s.total_donated,
      fill: SECTOR_COLORS[s.sector] || '#6b7280',
    }));

  const categoryBarData = (data?.category_breakdown || [])
    .filter(c => c.total > 0)
    .map(c => ({
      name: CATEGORY_DISPLAY[c.category] || c.category,
      value: c.total,
      fill: CATEGORY_COLORS[c.category] || '#6b7280',
    }));

  const sectorCompareData = (data?.sector_breakdown || []).map(s => ({
    name: SECTOR_LABELS[s.sector]?.replace(/^\S+\s/, '') || s.sector,
    donated: s.total_donated,
    spent: s.total_spent,
  }));

  return (
    <div className="bg-mesh min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/20 text-xs font-mono mb-3">
            💙 DONOR TRANSPARENCY PORTAL
          </div>
          <h1 className="text-3xl font-bold mb-1">Where is Your Money Going?</h1>
          <p className="text-sm text-muted max-w-2xl">
            Every rupee donated is tracked in real-time with cryptographic proof.
            This dashboard shows you exactly how your contributions are being spent across all NGOs.
          </p>
        </div>

        {/* Live Counter — The Hero */}
        <div className="mb-10">
          <LiveCounter />
        </div>

        {/* Beeceptor Integration Banner */}
        <div className="glass-card p-4 mb-8 border border-accent-green/20 bg-accent-green/5">
          <div className="flex items-center gap-3">
            <span className="text-xl">📡</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-accent-green">Live Webhook Integration Active</div>
              <p className="text-xs text-muted mt-0.5">
                Donations are received in real-time via <span className="font-mono text-accent-green">whitebox-test-123456.free.beeceptor.com → /api/webhook/donation</span>.
                Every incoming transfer automatically updates this dashboard.
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span className="text-xs text-accent-green font-mono">LIVE</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="glass-card p-4 mb-6 border border-red-500/20 bg-red-500/5 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-72 bg-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card p-5 text-center">
                <div className="text-xs text-muted uppercase tracking-wider mb-1">Total Donated</div>
                <div className="text-xl font-bold text-accent-green">{formatPKR(data?.overview.total_donated || 0)}</div>
                <div className="text-xs text-muted mt-1">{data?.overview.donation_count} donations</div>
              </div>
              <div className="glass-card p-5 text-center">
                <div className="text-xs text-muted uppercase tracking-wider mb-1">Verified Spent</div>
                <div className="text-xl font-bold text-accent-orange">{formatPKR(data?.overview.total_spent || 0)}</div>
                <div className="text-xs text-muted mt-1">{data?.overview.expense_count} expenses</div>
              </div>
              <div className="glass-card p-5 text-center">
                <div className="text-xs text-muted uppercase tracking-wider mb-1">Available Balance</div>
                <div className="text-xl font-bold text-accent-blue">{formatPKR(data?.overview.balance || 0)}</div>
                <div className="text-xs text-muted mt-1">In verified custody</div>
              </div>
              <div className="glass-card p-5 text-center">
                <div className="text-xs text-muted uppercase tracking-wider mb-1">Transparency Score</div>
                <div className="text-xl font-bold text-accent-purple">{data?.overview.transparency_score}/100</div>
                <div className="text-xs text-muted mt-1">{data?.overview.ngo_count} active NGOs</div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Sector Pie */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold mb-4">💰 Donations by Sector</h3>
                {sectorPieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={sectorPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                          {sectorPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f9fafb', fontSize: '12px' }}
                          formatter={(value) => [formatPKR(Number(value)), 'Donated']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                      {sectorPieData.map((s, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-muted">
                          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.fill }} />
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-sm text-muted">No donation data yet</div>
                )}
              </div>

              {/* Sector Donations vs Spending */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold mb-4">📊 Donations vs Spending by Sector</h3>
                {sectorCompareData.some(d => d.donated > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sectorCompareData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
                      <Tooltip
                        contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f9fafb', fontSize: '11px' }}
                        formatter={(value) => [formatPKR(Number(value)), '']}
                      />
                      <Bar dataKey="donated" fill="#10b981" radius={[4, 4, 0, 0]} name="Donated" />
                      <Bar dataKey="spent" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Spent" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center text-sm text-muted">No data yet</div>
                )}
              </div>
            </div>

            {/* Expense Category Breakdown */}
            <div className="glass-card p-6 mb-8">
              <h3 className="text-sm font-semibold mb-4">🧾 How Is Money Being Spent? (By Category)</h3>
              {categoryBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={categoryBarData} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => `${(v/1000000).toFixed(1)}M`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={80} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(17,24,39,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f9fafb', fontSize: '12px' }}
                      formatter={(value) => [formatPKR(Number(value)), 'Spent']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {categoryBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted">No expense data yet</div>
              )}
            </div>

            {/* NGO Efficiency + Funding Gaps */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-card p-6 lg:col-span-2">
                <h3 className="text-sm font-semibold mb-4">🏛️ NGO Efficiency Ratings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted border-b border-white/5">
                        <th className="text-left py-2 font-medium">Organization</th>
                        <th className="text-left py-2 font-medium">Sector</th>
                        <th className="text-center py-2 font-medium">Admin %</th>
                        <th className="text-center py-2 font-medium">Grade</th>
                        <th className="text-center py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.ngo_efficiency || []).length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-muted text-xs py-6">No NGO data available</td></tr>
                      ) : (data?.ngo_efficiency || []).map(ngo => (
                        <tr key={ngo.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                          <td className="py-3 font-medium text-sm">{ngo.name}</td>
                          <td className="py-3 text-muted text-xs">{SECTOR_LABELS[ngo.sector]?.replace(/^\S+\s/, '') || ngo.sector}</td>
                          <td className="py-3 text-center font-mono text-xs">{ngo.admin_ratio}%</td>
                          <td className="py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${GRADE_COLORS[ngo.efficiency_grade] || 'text-muted'}`}>
                              {ngo.efficiency_grade}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            {ngo.verified ? <span className="text-accent-green text-xs">✓ Verified</span> : <span className="text-muted text-xs">Pending</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <FundingGapAlert />
                <div className="glass-card p-5">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">🔒 Audit Integrity</h3>
                  <p className="text-xs text-muted leading-relaxed mb-3">
                    Every transaction is locked in a SHA-256 hash chain. Tampering with any record breaks the entire chain.
                  </p>
                  <a href="/audit" className="block text-center text-xs font-semibold text-accent-green border border-accent-green/20 rounded-lg py-2 hover:bg-accent-green/5 transition-colors">
                    Verify Audit Chain →
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
