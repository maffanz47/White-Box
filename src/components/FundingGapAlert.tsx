'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { SECTOR_LABELS } from '@/lib/utils/format';

interface FundingGap {
  sector: string;
  severity: 'critical' | 'high' | 'medium';
  remaining_pct: number;
  total_donated: number;
  total_spent: number;
}

export default function FundingGapAlert() {
  const [gaps, setGaps] = useState<FundingGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGaps() {
      const { data: donations } = await supabase
        .from('donations')
        .select('sector, amount')
        .eq('status', 'confirmed');

      const { data: expenses } = await supabase
        .from('expenses')
        .select('sector, amount')
        .eq('verified', true);

      if (!donations || !expenses) {
        setLoading(false);
        return;
      }

      const sectors = ['health', 'education', 'disaster_relief', 'infrastructure', 'food_security'];
      const gapList: FundingGap[] = [];

      sectors.forEach(sector => {
        const donated = donations.filter(d => d.sector === sector).reduce((s, d) => s + d.amount, 0);
        const spent = expenses.filter(e => e.sector === sector).reduce((s, e) => s + e.amount, 0);
        const remaining = donated - spent;
        const remainingPct = donated > 0 ? (remaining / donated) * 100 : 0;

        if (donated === 0 || remainingPct < 30) {
          gapList.push({
            sector,
            severity: donated === 0 ? 'critical' : remainingPct < 10 ? 'critical' : remainingPct < 20 ? 'high' : 'medium',
            remaining_pct: Math.max(0, Math.round(remainingPct)),
            total_donated: donated,
            total_spent: spent,
          });
        }
      });

      // Sort by severity
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      gapList.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

      setGaps(gapList);
      setLoading(false);
    }

    fetchGaps();
  }, []);

  if (loading) return null;
  if (gaps.length === 0) return null;

  const severityStyles = {
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-300',
      icon: '🚨',
    },
    high: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-300',
      icon: '⚠️',
    },
    medium: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      badge: 'bg-yellow-500/20 text-yellow-300',
      icon: '📊',
    },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold">Funding Gap Alerts</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-red/20 text-accent-red font-mono">
          {gaps.length}
        </span>
      </div>
      
      {gaps.map((gap) => {
        const style = severityStyles[gap.severity];
        return (
          <div
            key={gap.sector}
            className={`${style.bg} border ${style.border} rounded-xl p-4 transition-all hover:scale-[1.01]`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{style.icon}</span>
                <span className="font-medium text-sm">
                  {SECTOR_LABELS[gap.sector] || gap.sector}
                </span>
              </div>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${style.badge}`}>
                {gap.severity.toUpperCase()}
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    gap.severity === 'critical' ? 'bg-red-500' :
                    gap.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${Math.max(2, gap.remaining_pct)}%` }}
                />
              </div>
              <p className={`text-xs ${style.text} mt-1.5`}>
                {gap.remaining_pct}% funds remaining
                {gap.total_donated === 0 && ' — no donations received yet'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
