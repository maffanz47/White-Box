import LiveCounter from '@/components/LiveCounter';
import Link from 'next/link';

export const metadata = {
  title: 'WhiteBox — NGO Donation Transparency',
  description: 'Real-time, cryptographically verified transparency for NGO donations in Pakistan.',
};

const PORTALS = [
  {
    href: '/dashboard',
    label: 'Donor Analytics',
    desc: 'Track where your money went. Per-NGO breakdowns, sector allocation, and fund utilization — all live.',
    tag: 'Donors',
  },
  {
    href: '/admin',
    label: 'NGO Portal',
    desc: 'Record verified expenses against your available balance. Every submission hashed into the public audit chain.',
    tag: 'NGOs',
  },
  {
    href: '/audit',
    label: 'Audit Trail',
    desc: 'Inspect the SHA-256 hash chain. Re-verify every block. Publicly accessible, tamper-evident.',
    tag: 'Public',
  },
  {
    href: '/flow',
    label: 'Money Flow Map',
    desc: 'A live Sankey diagram showing every rupee from the donations pool to verified spending categories.',
    tag: 'Visual',
  },
];

export default function HomePage() {
  return (
    <div className="bg-mesh min-h-screen">

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-5 pt-20 pb-14">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 mb-6 px-2.5 py-1 rounded border border-zinc-700 bg-zinc-900 text-xs font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Micathon 2026 — Live Platform
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold text-zinc-100 tracking-tight mb-5 leading-[1.1]">
            Every rupee donated.<br />
            <span className="text-zinc-500">Publicly accounted for.</span>
          </h1>

          <p className="text-sm text-zinc-400 leading-relaxed mb-8 max-w-lg">
            WhiteBox is a real-time transparency layer for Pakistani NGOs.
            Donations arrive via Raast & 1Link webhooks. Every paisa is
            recorded, hashed, and permanently verifiable by anyone.
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-md bg-indigo-500 hover:bg-indigo-400 text-white font-semibold text-sm transition-colors"
            >
              Open Dashboard
            </Link>
            <Link
              href="/how-it-works"
              className="px-5 py-2.5 rounded-md border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 font-medium text-sm transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-6xl mx-auto px-5">
        <div className="border-t border-zinc-800" />
      </div>

      {/* ── Live Counter ── */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-4">Live Totals</p>
        <LiveCounter />
      </section>

      {/* ── Divider ── */}
      <div className="max-w-6xl mx-auto px-5">
        <div className="border-t border-zinc-800" />
      </div>

      {/* ── Portal Grid ── */}
      <section className="max-w-6xl mx-auto px-5 py-12">
        <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-6">Platform Portals</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PORTALS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="group block glass-card p-5 hover:border-zinc-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{p.tag}</span>
                <span className="text-zinc-700 group-hover:text-zinc-400 transition-colors text-base leading-none">→</span>
              </div>
              <div className="text-sm font-semibold text-zinc-200 mb-1.5">{p.label}</div>
              <p className="text-xs text-zinc-500 leading-relaxed">{p.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Stats row ── */}
      <div className="max-w-6xl mx-auto px-5">
        <div className="border-t border-zinc-800" />
      </div>
      <section className="max-w-6xl mx-auto px-5 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { v: '100%',   l: 'Chain Integrity',   s: 'SHA-256 verified' },
            { v: '<10%',   l: 'Avg Admin Overhead', s: 'across all NGOs' },
            { v: '<2s',    l: 'Settlement Time',    s: 'via Raast P2M' },
            { v: '8 NGOs', l: 'Active Organisations', s: 'verified & live' },
          ].map((s) => (
            <div key={s.l} className="py-5 border-r border-zinc-800 last:border-0">
              <div className="text-xl font-semibold text-zinc-100 mb-0.5">{s.v}</div>
              <div className="text-xs text-zinc-500">{s.l}</div>
              <div className="text-xs text-zinc-700 mt-0.5">{s.s}</div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
