'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatPKR } from '@/lib/utils/format';

interface LiveTotals {
  total_donated: number;
  total_spent: number;
  donation_count: number;
  expense_count: number;
}

export default function LiveCounter() {
  const [totals, setTotals] = useState<LiveTotals>({
    total_donated: 0,
    total_spent: 0,
    donation_count: 0,
    expense_count: 0,
  });
  const [displayDonated, setDisplayDonated] = useState(0);
  const [displaySpent, setDisplaySpent] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch initial totals
  const fetchTotals = useCallback(async () => {
    const { data, error } = await supabase
      .from('live_totals')
      .select('*')
      .single();

    if (!error && data) {
      setTotals(data);
      setLastUpdate(new Date());
    }
  }, []);

  // Animated counter effect
  useEffect(() => {
    const target = totals.total_donated;
    const duration = 1200;
    const startValue = displayDonated;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayDonated(Math.round(startValue + (target - startValue) * eased));

      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totals.total_donated]);

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

  // Realtime subscription
  useEffect(() => {
    const donationChannel = supabase
      .channel('donations-counter')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'donations' },
        (payload) => {
          const newDonation = payload.new as { amount: number; status: string };
          if (newDonation.status === 'confirmed') {
            setTotals(prev => ({
              ...prev,
              total_donated: prev.total_donated + newDonation.amount,
              donation_count: prev.donation_count + 1,
            }));
            setLastUpdate(new Date());
          }
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    const expenseChannel = supabase
      .channel('expenses-counter')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          const newExpense = payload.new as { amount: number; verified: boolean };
          if (newExpense.verified) {
            setTotals(prev => ({
              ...prev,
              total_spent: prev.total_spent + newExpense.amount,
              expense_count: prev.expense_count + 1,
            }));
            setLastUpdate(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(donationChannel);
      supabase.removeChannel(expenseChannel);
    };
  }, []);

  const balance = displayDonated - displaySpent;
  const utilizationRate = displayDonated > 0
    ? Math.round((displaySpent / displayDonated) * 100)
    : 0;

  return (
    <div className="w-full">
      {/* Live Status Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-accent-green animate-pulse' : 'bg-accent-orange'}`} />
        <span className="text-xs font-mono text-muted uppercase tracking-wider">
          {isLive ? 'Live — Real-time updates active' : 'Connecting...'}
        </span>
        {lastUpdate && (
          <span className="text-xs text-muted/60 font-mono">
            · {lastUpdate.toLocaleTimeString()}
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
            {totals.donation_count.toLocaleString()} donations verified
          </div>
        </div>

        {/* Spending Counter */}
        <div className="glass-card p-8 text-center" style={{ animationDelay: '1.5s' }}>
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

      {/* Balance & Trust Score Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="glass-card p-5 text-center">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            Available Balance
          </div>
          <div className="counter-value text-2xl font-bold text-foreground">
            {formatPKR(Math.max(0, balance))}
          </div>
        </div>

        {/* Utilization Rate */}
        <div className="glass-card p-5 text-center">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            Utilization Rate
          </div>
          <div className={`text-2xl font-bold ${
            utilizationRate > 80 ? 'text-accent-green' : 
            utilizationRate > 50 ? 'text-accent-orange' : 'text-accent-blue'
          }`}>
            {utilizationRate}%
          </div>
        </div>

        {/* Trust Score */}
        <div className="glass-card p-5 text-center">
          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
            Transparency Score
          </div>
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
