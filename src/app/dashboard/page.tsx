'use client';

import { useEffect, useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { formatPKR, SECTOR_LABELS, SECTOR_COLORS } from '@/lib/utils/format';
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

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [recentDonations, setRecentDonations] = useState<Array<{
    id: string;
    donor_name: string;
    amount: number;
    sector: string;
    channel: string;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsRes, donationsRes] = await Promise.all([
          fetch('/api/analytics/summary'),
          supabase
            .from('donations')
            .select('id, donor_name, amount, sector, channel, created_at')
            .eq('status', 'confirmed')
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        if (analyticsRes.ok) {
          setData(await analyticsRes.json());
        }

        if (donationsRes.data) {
          setRecentDonations(donationsRes.data);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-mesh min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted-bg rounded" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-48 bg-muted-bg rounded-2xl" />
              <div className="h-48 bg-muted-bg rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sectorPieData = data?.sector_breakdown.map(s => ({
    name: SECTOR_LABELS[s.sector] || s.sector,
    value: s.total_donated / 100,
    fill: SECTOR_COLORS[s.sector] || '#6b7280',
  })) || [];

  const categoryBarData = data?.category_breakdown.map(c => ({
    name: CATEGORY_DISPLAY[c.category] || c.category,
    value: c.total / 100,
    fill: CATEGORY_COLORS[c.category] || '#6b7280',
  })) || [];

  const gradeColors: Record<string, string> = {
    A: 'text-green-400 bg-green-400/10 border-green-400/30',
    B: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    C: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
    D: 'text-red-400 bg-red-400/10 border-red-400/30',
  };

  return (
    <div className="bg-mesh min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Analytics Dashboard</h1>
          <p className="text-sm text-muted">Real-time financial transparency for all tracked NGOs</p>
        </div>

        {/* Live Counter */}
        <div className="mb-8">
          <LiveCounter />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sector Pie Chart */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4">Donations by Sector</h3>
            {sectorPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={sectorPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {sectorPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#f9fafb',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [formatPKR(Number(value) * 100), 'Total']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted">No data</div>
            )}
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {sectorPieData.map((s, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: s.fill }} />
                  {s.name}
                </div>
              ))}
            </div>
          </div>

          {/* Expense Category Breakdown */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4">Spending by Category</h3>
            {categoryBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryBarData} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}K`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} width={70} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(17, 24, 39, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#f9fafb',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [formatPKR(Number(value) * 100), 'Spent']}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {categoryBarData.map((entry, index) => (
                      <Cell key={`cat-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted">No data</div>
            )}
          </div>
        </div>

        {/* Bottom Row: NGO Table + Funding Gaps + Recent Donations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NGO Efficiency Table */}
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold mb-4">NGO Efficiency Ratings</h3>
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
                  {(data?.ngo_efficiency || []).map((ngo) => (
                    <tr key={ngo.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                      <td className="py-3 font-medium">{ngo.name}</td>
                      <td className="py-3 text-muted text-xs">
                        {SECTOR_LABELS[ngo.sector] || ngo.sector}
                      </td>
                      <td className="py-3 text-center font-mono text-xs">
                        {ngo.admin_ratio}%
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${gradeColors[ngo.efficiency_grade] || 'text-muted'}`}>
                          {ngo.efficiency_grade}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        {ngo.verified ? (
                          <span className="text-accent-green text-xs">✓ Verified</span>
                        ) : (
                          <span className="text-muted text-xs">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Funding Gaps + Recent Donations */}
          <div className="space-y-6">
            <FundingGapAlert />

            {/* Recent Donations Feed */}
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold mb-3">Recent Donations</h3>
              <div className="space-y-3">
                {recentDonations.slice(0, 5).map((d) => (
                  <div key={d.id} className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium">{d.donor_name}</span>
                      <span className="text-muted ml-1.5">
                        via {d.channel}
                      </span>
                    </div>
                    <span className="font-mono text-accent-green">
                      +{formatPKR(d.amount)}
                    </span>
                  </div>
                ))}
                {recentDonations.length === 0 && (
                  <p className="text-xs text-muted">No donations yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
