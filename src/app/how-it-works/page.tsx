import Link from 'next/link';

export const metadata = {
  title: 'How It Works — WhiteBox',
  description: 'A technical walkthrough of how WhiteBox tracks NGO donations with SHA-256 cryptographic audit chains.',
};

const STEPS = [
  {
    num: '01',
    title: 'Donor Sends Money via Bank',
    body: 'A donor transfers funds using Raast P2M or 1Link. The bank system fires an HTTP webhook containing the transaction payload — donor ID, amount in paisa, sector, and the target NGO.',
    detail: 'The webhook is routed through Beeceptor (a proxy layer) before arriving at the WhiteBox Vercel API. This ensures the integration mirrors a real banking API pipeline.',
    accent: 'border-l-emerald-500',
  },
  {
    num: '02',
    title: 'API Validates & Records the Donation',
    body: 'The Next.js server-side API at /api/webhook/donation validates every field — amount must be positive, sector must be one of 5 allowed values, and the transaction reference must be unique.',
    detail: 'Once validated, the donation is inserted into the Supabase Postgres database with status "confirmed". No client-side code touches the database — only server-side service-role keys are used.',
    accent: 'border-l-sky-500',
  },
  {
    num: '03',
    title: 'SHA-256 Hash Block Is Created',
    body: 'The API fetches the hash of the previous audit entry, combines it with the new donation data, and computes a SHA-256 hash. This hash is stored as a new block in the audit_log table.',
    detail: 'The chain structure is: Block[N].prev_hash === Block[N-1].payload_hash. Changing any single record changes its hash, which breaks every block after it — making tampering cryptographically detectable.',
    accent: 'border-l-violet-500',
  },
  {
    num: '04',
    title: 'Real-Time Dashboard Updates',
    body: 'Supabase Realtime detects the new database row and broadcasts a WebSocket event. Every browser with the dashboard open receives it instantly and re-fetches totals — no page refresh needed.',
    detail: 'The LiveCounter animates to the new value. The per-NGO analytics and money flow map also reflect the new donation immediately.',
    accent: 'border-l-amber-500',
  },
  {
    num: '05',
    title: 'NGO Logs a Verified Expense',
    body: 'The NGO admin opens the NGO Portal and submits a spending record: vendor name, category, receipt reference, and amount. The server checks the NGO\'s available balance before accepting it.',
    detail: 'Available balance = Total donations received by that NGO minus total verified expenses. If the expense amount exceeds available balance, the server returns HTTP 422 Insufficient Balance.',
    accent: 'border-l-rose-500',
  },
  {
    num: '06',
    title: 'Public Audit Verification',
    body: 'Anyone can open the Audit Trail page and click "Verify Chain Integrity". The server re-computes every SHA-256 hash from scratch and checks that each block\'s prev_hash matches the previous block.',
    detail: 'If the chain is intact, every block shows as valid. If any database record was tampered with manually, the verification will detect the broken link and report exactly which block was altered.',
    accent: 'border-l-emerald-500',
  },
];

const TECH = [
  { name: 'Next.js 15', role: 'App framework — App Router, server-side API routes' },
  { name: 'Supabase', role: 'Postgres database + Realtime WebSocket engine' },
  { name: 'SHA-256', role: 'Cryptographic hash function for audit chain' },
  { name: 'Beeceptor', role: 'Mock API proxy — simulates real Raast/1Link webhooks' },
  { name: 'Recharts', role: 'Interactive charts — Sankey, Pie, Bar diagrams' },
  { name: 'Vercel', role: 'Production deployment with automatic CI/CD from GitHub' },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-mesh min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-xs text-muted hover:text-foreground transition-colors font-mono">← Back to Home</Link>
          <h1 className="text-3xl font-bold mt-4 mb-2">How WhiteBox Works</h1>
          <p className="text-muted text-sm max-w-xl">
            A full technical walkthrough of the donation lifecycle — from the bank webhook to the cryptographic audit trail.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-14">
          {STEPS.map((step) => (
            <div key={step.num} className={`glass-card p-6 border-l-2 ${step.accent}`}>
              <div className="flex items-start gap-4">
                <span className="text-xs font-mono text-muted/50 pt-0.5 shrink-0 w-6">{step.num}</span>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted leading-relaxed mb-2">{step.body}</p>
                  <p className="text-xs text-muted/60 leading-relaxed border-t border-white/5 pt-2">{step.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="glass-card p-6 mb-8">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted">Technology Stack</h2>
          <div className="space-y-3">
            {TECH.map((t) => (
              <div key={t.name} className="flex items-start gap-4">
                <span className="text-xs font-mono font-semibold text-foreground/80 w-28 shrink-0">{t.name}</span>
                <span className="text-xs text-muted">{t.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Flow Summary */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted">Data Flow Summary</h2>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            {['Bank / Simulator', 'Beeceptor Proxy', 'Vercel API', 'Supabase DB', 'Hash Block', 'Real-time Push', 'Dashboard UI'].map((node, i, arr) => (
              <>
                <span key={node} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 font-mono text-muted/80">{node}</span>
                {i < arr.length - 1 && <span key={`arrow-${i}`} className="text-muted/30">→</span>}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
