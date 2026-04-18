import LiveCounter from '@/components/LiveCounter';
import Link from 'next/link';

export const metadata = {
  title: 'WhiteBox — Where Every Rupee Tells the Truth',
  description: 'Real-time NGO donation transparency for Pakistan. Every rupee tracked, every expense verified, every audit cryptographically sealed.',
};

const PORTALS = [
  {
    href: '/dashboard',
    label: 'Donor Analytics',
    desc: 'See exactly where donations are going. Compare NGOs, track sector allocation, and verify fund utilization in real time.',
    accent: 'from-emerald-500/20 to-emerald-500/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    tag: 'For Donors',
    tagColor: 'text-emerald-400 bg-emerald-500/10',
  },
  {
    href: '/admin',
    label: 'NGO Portal',
    desc: 'Submit verified expenses against your available balance. Every submission is hashed and permanently added to the audit chain.',
    accent: 'from-amber-500/20 to-amber-500/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    tag: 'For NGOs',
    tagColor: 'text-amber-400 bg-amber-500/10',
  },
  {
    href: '/audit',
    label: 'Audit Trail',
    desc: 'Inspect the public SHA-256 hash chain. Re-verify every block independently. Tampering is cryptographically impossible.',
    accent: 'from-violet-500/20 to-violet-500/5',
    border: 'border-violet-500/20 hover:border-violet-500/40',
    tag: 'Public Verification',
    tagColor: 'text-violet-400 bg-violet-500/10',
  },
  {
    href: '/flow',
    label: 'Money Flow Map',
    desc: 'A live Sankey diagram showing every rupee moving from the donations pool through verified NGOs to specific spending categories.',
    accent: 'from-sky-500/20 to-sky-500/5',
    border: 'border-sky-500/20 hover:border-sky-500/40',
    tag: 'Visual Transparency',
    tagColor: 'text-sky-400 bg-sky-500/10',
  },
];

const STATS = [
  { label: 'Audit Chain Integrity', value: '100%', sub: 'SHA-256 verified' },
  { label: 'Avg Admin Overhead', value: '<10%', sub: 'across all NGOs' },
  { label: 'Settlement Time', value: '<2s', sub: 'via Raast P2M' },
  { label: 'Data Availability', value: '24 / 7', sub: 'public & immutable' },
];

export default function HomePage() {
  return (
    <div className="bg-mesh min-h-screen">

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 tracking-widest">LIVE — MICATHON 2026</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
            <span className="text-foreground">Every Rupee.</span>
            <br />
            <span className="gradient-text">Publicly Accountable.</span>
          </h1>

          <p className="text-base text-muted max-w-xl mx-auto mb-10 leading-relaxed">
            WhiteBox is a cryptographic transparency layer for Pakistani NGOs.
            Donations flow in via Raast and 1Link — every paisa is tracked,
            hashed, and permanently verifiable by anyone.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/dashboard"
              className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/20"
            >
              Open Donor Portal
            </Link>
            <Link
              href="/how-it-works"
              className="px-7 py-3 rounded-xl border border-white/10 text-foreground font-semibold text-sm hover:bg-white/5 transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live Counter ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <LiveCounter />
      </section>

      {/* ── Stats Row ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="glass-card p-5 text-center">
              <div className="text-2xl font-bold text-foreground mb-0.5">{s.value}</div>
              <div className="text-xs font-semibold text-muted/80 mb-0.5">{s.label}</div>
              <div className="text-xs text-muted/50">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Portal Cards ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-1">Platform Portals</h2>
          <p className="text-sm text-muted">Every stakeholder has a dedicated, purpose-built view.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PORTALS.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={`glass-card p-6 border transition-all duration-200 group bg-gradient-to-br ${p.accent} ${p.border}`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${p.tagColor}`}>
                  {p.tag}
                </span>
                <span className="text-muted group-hover:text-foreground transition-colors text-sm">→</span>
              </div>
              <h3 className="text-base font-bold mb-2">{p.label}</h3>
              <p className="text-xs text-muted leading-relaxed">{p.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer strip ── */}
      <div className="border-t border-white/5 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs text-muted flex-wrap gap-2">
          <span>WhiteBox &copy; 2026 — Micathon Hackathon</span>
          <div className="flex items-center gap-4 font-mono">
            <span>Next.js 15</span>
            <span>Supabase</span>
            <span>SHA-256</span>
            <span>Vercel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
