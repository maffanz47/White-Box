'use client';

import { useEffect, useState } from 'react';
import {
  Sankey,
  Tooltip,
  ResponsiveContainer,
  Rectangle,
  Layer,
} from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { formatPKR, SECTOR_LABELS, SECTOR_COLORS } from '@/lib/utils/format';

interface FlowData {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
}

// Custom node renderer for better visuals
function CustomNode({ x, y, width, height, index, payload }: {
  x: number; y: number; width: number; height: number; index: number; payload: { name: string };
}) {
  const isSource = index === 0;
  const isNGO = payload.name.includes('Foundation') || payload.name.includes('Trust') || payload.name.includes('Memorial') || payload.name.includes('Citizens') || payload.name.includes('HANDS');
  
  let fill = '#6366f1';
  if (isSource) fill = '#10b981';
  else if (isNGO) fill = '#3b82f6';
  else fill = '#f59e0b';

  return (
    <Layer key={`node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={0.9}
        rx={4}
        ry={4}
      />
      <text
        x={x + width + 8}
        y={y + height / 2}
        textAnchor="start"
        dominantBaseline="middle"
        fontSize={11}
        fill="#9ca3af"
        fontFamily="Inter, sans-serif"
      >
        {payload.name}
      </text>
    </Layer>
  );
}

export default function MoneyFlowSankey() {
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFlowData() {
      try {
        // Fetch donations grouped by NGO
        const { data: donations } = await supabase
          .from('donations')
          .select('ngo_id, amount, sector')
          .eq('status', 'confirmed');

        // Fetch NGOs
        const { data: ngos } = await supabase
          .from('ngos')
          .select('id, name, sector');

        // Fetch expenses grouped by category
        const { data: expenses } = await supabase
          .from('expenses')
          .select('ngo_id, amount, category')
          .eq('verified', true);

        if (!donations || !ngos || !expenses) {
          setLoading(false);
          return;
        }

        // Build nodes: [Public Pool] -> [NGOs] -> [Expense Categories]
        const nodeNames: string[] = ['Public Donations Pool'];
        const ngoNodeMap: Record<string, number> = {};
        const categoryNodeMap: Record<string, number> = {};

        // Add NGO nodes
        ngos.forEach(ngo => {
          if (!ngoNodeMap[ngo.id]) {
            ngoNodeMap[ngo.id] = nodeNames.length;
            nodeNames.push(ngo.name);
          }
        });

        // Add category nodes
        const categories = ['Direct Aid', 'Logistics', 'Admin', 'Vendor Payment', 'Salary'];
        categories.forEach(cat => {
          categoryNodeMap[cat] = nodeNames.length;
          nodeNames.push(cat);
        });

        const categoryKeyMap: Record<string, string> = {
          direct_aid: 'Direct Aid',
          logistics: 'Logistics',
          admin: 'Admin',
          vendor_payment: 'Vendor Payment',
          salary: 'Salary',
        };

        // Build links
        const links: { source: number; target: number; value: number }[] = [];

        // Pool -> NGOs (aggregate donations)
        const ngoTotals: Record<string, number> = {};
        donations.forEach(d => {
          if (d.ngo_id) {
            ngoTotals[d.ngo_id] = (ngoTotals[d.ngo_id] || 0) + d.amount;
          }
        });

        Object.entries(ngoTotals).forEach(([ngoId, total]) => {
          if (ngoNodeMap[ngoId] !== undefined && total > 0) {
            links.push({
              source: 0,
              target: ngoNodeMap[ngoId],
              value: total / 100, // Convert paisa to rupees for readability
            });
          }
        });

        // NGOs -> Categories (aggregate expenses)
        const ngoCategoryTotals: Record<string, Record<string, number>> = {};
        expenses.forEach(e => {
          if (!ngoCategoryTotals[e.ngo_id]) ngoCategoryTotals[e.ngo_id] = {};
          const catName = categoryKeyMap[e.category] || e.category;
          ngoCategoryTotals[e.ngo_id][catName] = (ngoCategoryTotals[e.ngo_id][catName] || 0) + e.amount;
        });

        Object.entries(ngoCategoryTotals).forEach(([ngoId, cats]) => {
          Object.entries(cats).forEach(([catName, total]) => {
            if (ngoNodeMap[ngoId] !== undefined && categoryNodeMap[catName] !== undefined && total > 0) {
              links.push({
                source: ngoNodeMap[ngoId],
                target: categoryNodeMap[catName],
                value: total / 100,
              });
            }
          });
        });

        if (links.length > 0) {
          setFlowData({
            nodes: nodeNames.map(name => ({ name })),
            links,
          });
        }
      } catch (err) {
        console.error('Flow data error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFlowData();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="animate-pulse text-muted">Loading money flow...</div>
      </div>
    );
  }

  if (!flowData || flowData.links.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-muted text-sm">No flow data available yet. Seed data first.</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Money Flow Map</h3>
          <p className="text-sm text-muted mt-1">
            Track every rupee from donation to impact
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-accent-green" /> Donations
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-accent-blue" /> NGOs
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-accent-orange" /> Spending
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <Sankey
          data={flowData}
          nodeWidth={12}
          nodePadding={24}
          linkCurvature={0.5}
          node={<CustomNode x={0} y={0} width={0} height={0} index={0} payload={{ name: '' }} />}
          link={{ stroke: '#374151', strokeOpacity: 0.4 }}
          margin={{ top: 10, right: 160, bottom: 10, left: 10 }}
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
    </div>
  );
}
