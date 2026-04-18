'use client';

import { useEffect, useState } from 'react';
import {
  Sankey, Tooltip, ResponsiveContainer, Rectangle, Layer,
} from 'recharts';
import { formatPKR } from '@/lib/utils/format';

interface FlowData {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
  empty?: boolean;
}

interface SankeyNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: { name: string };
}

function SankeyNode({ x, y, width, height, index, payload }: SankeyNodeProps) {
  const name = payload.name;
  const isPool = index === 0;
  const isCategory = ['Direct Aid', 'Logistics', 'Admin', 'Vendor Payment', 'Salary'].includes(name);
  const fill = isPool ? '#10b981' : isCategory ? '#f59e0b' : '#3b82f6';

  return (
    <Layer key={`node-${index}`}>
      <Rectangle x={x} y={y} width={width} height={height} fill={fill} fillOpacity={0.9} rx={3} ry={3} />
      <text
        x={isCategory ? x + width + 8 : x - 8}
        y={y + height / 2}
        textAnchor={isCategory ? 'start' : 'end'}
        dominantBaseline="middle"
        fontSize={11}
        fill="#9ca3af"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {name}
      </text>
    </Layer>
  );
}

export default function MoneyFlowPage() {
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/flow')
      .then(r => r.ok ? r.json() : Promise.reject('API error'))
      .then((data: FlowData) => setFlowData(data))
      .catch(() => setError('Failed to load flow data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-mesh min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Money Flow Map</h1>
          <p className="text-sm text-muted">
            Every verified rupee tracked from donor to impact — Donations Pool to NGOs to verified spending categories
          </p>
        </div>

        {/* Legend */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-center gap-8 text-xs flex-wrap">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-accent-green inline-block" />
              Donations Pool
            </span>
            <span className="text-muted font-mono">—</span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-accent-blue inline-block" />
              Verified NGOs
            </span>
            <span className="text-muted font-mono">—</span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-accent-orange inline-block" />
              Expense Categories
            </span>
          </div>
        </div>

        {/* Sankey Diagram */}
        <div className="glass-card p-6 mb-6">
          {loading ? (
            <div className="h-[420px] flex items-center justify-center">
              <div className="text-sm text-muted animate-pulse">Loading flow data...</div>
            </div>
          ) : error ? (
            <div className="h-[420px] flex items-center justify-center">
              <div className="text-sm text-red-400">{error}</div>
            </div>
          ) : !flowData || flowData.empty || flowData.links.length === 0 ? (
            <div className="h-[420px] flex flex-col items-center justify-center gap-3">
              <div className="text-sm font-semibold">No Flow Data Yet</div>
              <p className="text-xs text-muted text-center max-w-sm">
                Once donations are assigned to specific NGOs and those NGOs log verified expenses, the flow map will populate.
                Use the bank simulator to send a donation, then log an expense from the NGO portal.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <Sankey
                data={flowData}
                nodeWidth={14}
                nodePadding={20}
                linkCurvature={0.5}
                node={<SankeyNode x={0} y={0} width={0} height={0} index={0} payload={{ name: '' }} />}
                link={{ stroke: 'rgba(255,255,255,0.08)', strokeOpacity: 1, fill: 'rgba(255,255,255,0.04)' }}
                margin={{ top: 10, right: 180, bottom: 10, left: 120 }}
              >
                <Tooltip
                  contentStyle={{
                    background: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [formatPKR(Number(value) * 100), 'Amount']}
                />
              </Sankey>
            </ResponsiveContainer>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">How to Read This</div>
            <p className="text-sm text-foreground/80">
              The width of each flow band represents the amount of money.
              Wider = more money moving through that path.
            </p>
          </div>
          <div className="glass-card p-5">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Cryptographic Proof</div>
            <p className="text-sm text-foreground/80">
              Every flow shown here is backed by a verified, hashed transaction in the audit chain.
              Nothing can appear here without a valid hash block.
            </p>
          </div>
          <div className="glass-card p-5">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Spending Categories</div>
            <p className="text-sm text-foreground/80">
              <strong>Direct Aid</strong> goes straight to beneficiaries.
              <strong> Admin</strong> covers overhead. Lower admin ratio = higher NGO efficiency grade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
