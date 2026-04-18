'use client';

import { useEffect, useState } from 'react';
import { formatPKR } from '@/lib/utils/format';

interface FlowData {
  nodes: { name: string }[];
  links: { source: number; target: number; value: number }[];
  empty?: boolean;
}

// Node color by position in the flow
function nodeColor(index: number, name: string): string {
  if (index === 0) return '#10b981'; // Pool = green
  const categories = ['Direct Aid', 'Logistics', 'Admin', 'Vendor Payment', 'Salary'];
  if (categories.includes(name)) {
    const catColors: Record<string, string> = {
      'Direct Aid': '#10b981',
      'Logistics': '#3b82f6',
      'Admin': '#ef4444',
      'Vendor Payment': '#f59e0b',
      'Salary': '#8b5cf6',
    };
    return catColors[name] || '#6b7280';
  }
  return '#3b82f6'; // NGO = blue
}

// Draw the Sankey manually using SVG for full control
function SankeyDiagram({ data }: { data: FlowData }) {
  const W = 900;
  const H = 440;
  const nodeW = 16;
  const nodePad = 18;

  const nodes = data.nodes;
  const links = data.links;

  // Determine columns: 0=pool, 1=NGOs, 2=categories
  const colOf: Record<number, number> = {};
  colOf[0] = 0;
  nodes.forEach((_, i) => {
    if (i === 0) return;
    const isTarget = links.some(l => l.target === i && l.source === 0);
    colOf[i] = isTarget ? 1 : 2;
  });

  // Column X positions
  const colX: Record<number, number> = { 0: 80, 1: 340, 2: 700 };

  // Compute total value per node
  const nodeValue: number[] = new Array(nodes.length).fill(0);
  links.forEach(l => {
    nodeValue[l.source] += l.value;
    nodeValue[l.target] += l.value;
  });

  const maxVal = Math.max(...nodeValue.filter(v => v > 0));
  const scale = (H - (nodes.length * nodePad)) / maxVal;

  // Assign Y positions per column
  const nodeY: number[] = new Array(nodes.length).fill(0);
  const nodeH: number[] = nodes.map((_, i) => Math.max(6, nodeValue[i] * scale));

  [0, 1, 2].forEach(col => {
    const inCol = nodes.map((_, i) => i).filter(i => colOf[i] === col);
    const totalH = inCol.reduce((s, i) => s + nodeH[i], 0) + (inCol.length - 1) * nodePad;
    let y = (H - totalH) / 2;
    inCol.forEach(i => {
      nodeY[i] = y;
      y += nodeH[i] + nodePad;
    });
  });

  // Draw links as cubic bezier paths
  const sourceOffset: number[] = new Array(nodes.length).fill(0);
  const targetOffset: number[] = new Array(nodes.length).fill(0);

  const paths = links.map(l => {
    const sv = Math.max(2, l.value * scale);
    const tv = sv;
    const sx = colX[colOf[l.source]] + nodeW;
    const sy = nodeY[l.source] + sourceOffset[l.source] + sv / 2;
    const tx = colX[colOf[l.target]];
    const ty = nodeY[l.target] + targetOffset[l.target] + tv / 2;
    sourceOffset[l.source] += sv;
    targetOffset[l.target] += tv;

    const mx = (sx + tx) / 2;
    const d = `M ${sx} ${sy - sv/2} C ${mx} ${sy - sv/2}, ${mx} ${ty - tv/2}, ${tx} ${ty - tv/2} L ${tx} ${ty + tv/2} C ${mx} ${ty + tv/2}, ${mx} ${sy + sv/2}, ${sx} ${sy + sv/2} Z`;
    return { d, sx, sy, tx, ty, sv, tv, value: l.value, source: l.source, target: l.target };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 440 }}>
      {/* Links */}
      {paths.map((p, i) => (
        <g key={i}>
          <path
            d={p.d}
            fill={nodeColor(p.source, nodes[p.source].name)}
            fillOpacity={0.18}
            stroke={nodeColor(p.source, nodes[p.source].name)}
            strokeOpacity={0.35}
            strokeWidth={0.5}
          />
          <title>{nodes[p.source].name} → {nodes[p.target].name}: {formatPKR(p.value * 100)}</title>
        </g>
      ))}

      {/* Nodes */}
      {nodes.map((node, i) => (
        <g key={i}>
          <rect
            x={colX[colOf[i]]}
            y={nodeY[i]}
            width={nodeW}
            height={nodeH[i]}
            fill={nodeColor(i, node.name)}
            rx={3}
            opacity={0.92}
          />
          <text
            x={colOf[i] === 2 ? colX[2] + nodeW + 8 : colX[colOf[i]] - 8}
            y={nodeY[i] + nodeH[i] / 2}
            textAnchor={colOf[i] === 2 ? 'start' : 'end'}
            dominantBaseline="middle"
            fontSize={10.5}
            fill="#9ca3af"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {node.name}
          </text>
          <text
            x={colOf[i] === 2 ? colX[2] + nodeW + 8 : colX[colOf[i]] - 8}
            y={nodeY[i] + nodeH[i] / 2 + 14}
            textAnchor={colOf[i] === 2 ? 'start' : 'end'}
            dominantBaseline="middle"
            fontSize={9}
            fill="#4b5563"
            fontFamily="Inter, system-ui, monospace"
          >
            {formatPKR(nodeValue[i] * 100)}
          </text>
        </g>
      ))}

      {/* Column labels */}
      {[
        { x: colX[0] + nodeW / 2, label: 'POOL' },
        { x: colX[1] + nodeW / 2, label: 'NGOs' },
        { x: colX[2] + nodeW / 2, label: 'SPENDING' },
      ].map(col => (
        <text
          key={col.label}
          x={col.x}
          y={12}
          textAnchor="middle"
          fontSize={9}
          fill="#374151"
          fontFamily="Inter, monospace"
          letterSpacing="0.1em"
        >
          {col.label}
        </text>
      ))}
    </svg>
  );
}

export default function MoneyFlowSankey() {
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/flow')
      .then(r => r.ok ? r.json() : null)
      .then(data => setFlowData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-8 text-center text-sm text-muted animate-pulse">
        Loading money flow...
      </div>
    );
  }

  if (!flowData || flowData.empty || !flowData.links?.length) {
    return (
      <div className="glass-card p-10 text-center">
        <p className="text-sm font-medium mb-1">No Flow Data Yet</p>
        <p className="text-xs text-muted">
          Send a donation via the bank simulator, then log an expense from the NGO portal to see flows appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold">Money Flow Map</h3>
          <p className="text-xs text-muted mt-0.5">Every rupee tracked from donation pool to verified spending</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Pool / Direct Aid</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> NGOs</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Other Spending</span>
        </div>
      </div>
      <SankeyDiagram data={flowData} />
    </div>
  );
}
