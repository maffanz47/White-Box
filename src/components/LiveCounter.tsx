'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatPKR } from '@/lib/utils/format';

interface LiveTotals {
  total_donated: number;
  total_spent: number;
  donation_count: number;
  expense_count: number;
  balance: number;
}

export default function LiveCounter() {
  const [totals, setTotals] = useState<LiveTotals>({
    total_donated: 0,
    total_spent: 0,
    donation_count: 0,
    expense_count: 0,
    balance: 0,
  });
  const [displayDonated, setDisplayDonated] = useState(0);
  const [displaySpent, setDisplaySpent] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch totals via our server-side API (bypasses Supabase client-side 401)
  const fetchTotals = useCallback(async () => {
    try {
      const res = await fetch('/api/totals');
      if (res.ok) {
        const data = await res.json();
        setTotals(data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch totals:', err);
    }
  }, []);

  // Animated counter — donated
  useEffect(() => {
    const target = totals.total_donated;
    const duration = 1200;
    const startValue = displayDonated;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayDonated(Math.round(startValue + (target - startValue) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.total_donated]);

  // Animated counter — spent
  useEffect(() => {
    const target = totals.total_spent;
    const duration = 1200;
    const startValue = displaySpent;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplaySpent(Math.round(startValue + (target - startValue) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.total_spent]);

  // Initial fetch
  useEffect(() => {
    fetchTotals();
  }, [fetchTotals]);

  // Supabase Realtime — listen for new donations/expenses and refresh totals
  useEffect(() => {
    const donationChannel = supabase
      .channel('realtime-donations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations' },
        () => {
          // Re-fetch from server instead of accumulating locally (more reliable)
          fetchTotals();
          setLastUpdate(new Date());
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    const expenseChannel = supabase
      .channel('realtime-expenses')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        () => {
          fetchTotals();
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    // Fallback: poll every 10 seconds if realtime fails
    const pollInterval = setInterval(fetchTotals, 10000);

    return () => {
      supabase.removeChannel(donationChannel);
      supabase.removeChannel(expenseChannel);
      clearInterval(pollInterval);
    };
  }, [fetchTotals]);

  const utilizationRate = displayDonated > 0
    ? Math.round((displaySpent / displayDonated) * 100)
    : 0;

  return (
    <div className="w-full">
      {/* Live Status Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-accent-green animate-pulse' : 'bg-accent-orange animate-pulse'}`} />
        <span className="text-xs font-mono text-muted uppercase tracking-wider">
          {isLive ? 'Live — Real-time updates active' : 'Connected — Polling active'}
        </span>
        {lastUpdate && (
          <span className="text-xs text-muted/60 font-mono">
            · Updated {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Main Counter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Donations Counter */}
        <div className="glass-card p-8 text-center animate-pulse-glow">
          <div className="text-sm font-medium text-accent-green/80 uppercase tracking-wider mb-2">
            Total Donations Received
          </div>
          <div className="counter-value counter-green text-4xl md:text-5xl font-bold mb-2">
            {formatPKR(displayDonated)}
          </div>
          <div className="text-sm text-muted">
            {totals.donation_count.toLocaleString()} donations confirmed
          </div>
        </div>

        {/* Spending Counter */}
        <div className="glass-card p-8 text-center">
          <div className="text-sm font-medium text-accent-orange/80 uppercase tracking-wider mb-2">
            Total Verified Spending
          </div>
          <div className="counter-value counter-orange text-4xl md:text-5xl font-bold mb-2">
            {formatPKR(displaySpent)}
          </div>
          <div className="text-sm text-muted">
            {totals.expense_count.toLocaleString()} expenses verified
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 text-center">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Available Balance</div>
          <div className="counter-value text-2xl font-bold text-foreground">
            {formatPKR(Math.max(0, displayDonated - displaySpent))}
          </div>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Utilization Rate</div>
          <div className={`text-2xl font-bold ${
            utilizationRate > 80 ? 'text-accent-green' :
            utilizationRate > 50 ? 'text-accent-orange' : 'text-accent-blue'
          }`}>
            {utilizationRate}%
          </div>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">Transparency Score</div>
          <div className="flex items-center justify-center gap-2">
            <div className="text-2xl font-bold text-accent-green">
              {Math.min(100, utilizationRate + 10)}
            </div>
            <span className="text-xs text-accent-green">/100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
