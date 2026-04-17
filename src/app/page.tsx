import LiveCounter from '@/components/LiveCounter';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="bg-mesh min-h-screen">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <div className="text-center mb-12 animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent-green/20 bg-accent-green/5 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="text-xs font-mono text-accent-green tracking-wider">
              TRUST-AS-A-SERVICE PLATFORM
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Where Every Rupee
            <br />
            <span className="gradient-text">Tells the Truth</span>
          </h1>

          <p className="text-lg text-muted max-w-2xl mx-auto mb-8">
            Real-time transparency for NGO donations in Pakistan. Track every donation, 
            verify every expense, and prove it with cryptographic integrity.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent-green to-accent-blue text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              View Dashboard →
            </Link>
            <Link
              href="/audit"
              className="px-6 py-3 rounded-xl border border-white/10 text-foreground font-semibold text-sm hover:bg-white/5 transition-colors"
            >
              Verify Integrity
            </Link>
          </div>
        </div>

        {/* Live Counter */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <LiveCounter />
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2">How White Box Works</h2>
          <p className="text-sm text-muted">Three pillars of financial transparency</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-12 h-12 rounded-xl bg-accent-green/10 flex items-center justify-center text-2xl mb-4">
              🔒
            </div>
            <h3 className="text-lg font-semibold mb-2">SHA-256 Hash Chain</h3>
            <p className="text-sm text-muted leading-relaxed">
              Every transaction is cryptographically hashed and chained. 
              Tamper with one record and the entire chain breaks — 
              <span className="text-accent-green font-medium"> provably immutable</span>.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center text-2xl mb-4">
              📡
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
            <p className="text-sm text-muted leading-relaxed">
              Watch donations and expenses update live as they happen. 
              No refresh needed — powered by 
              <span className="text-accent-blue font-medium"> Supabase Realtime</span>.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center text-2xl mb-4">
              📊
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Analytics</h3>
            <p className="text-sm text-muted leading-relaxed">
              Sector tracking, funding gap alerts, and NGO efficiency ratios. 
              Know exactly 
              <span className="text-accent-purple font-medium"> where help is needed most</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Money Flow Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-card p-8 text-center">
          <div className="text-sm font-mono text-muted mb-4">THE MONEY FLOW</div>
          <div className="flex items-center justify-center gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-green/10 border border-accent-green/20">
              <span className="text-accent-green font-semibold">🏦 Donor</span>
            </div>
            <span className="text-muted">→</span>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
              <span className="text-accent-blue font-semibold">📦 Public Pool</span>
            </div>
            <span className="text-muted">→</span>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
              <span className="text-accent-purple font-semibold">🏛️ Verified NGO</span>
            </div>
            <span className="text-muted">→</span>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-orange/10 border border-accent-orange/20">
              <span className="text-accent-orange font-semibold">🧾 Vendor Receipt</span>
            </div>
          </div>
          <p className="text-xs text-muted mt-4">
            Every step is recorded. Every rupee is tracked. Every hash is verified.
          </p>
          <Link
            href="/flow"
            className="inline-block mt-4 text-sm text-accent-green hover:text-accent-green/80 transition-colors"
          >
            View Full Sankey Diagram →
          </Link>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold mb-2">Built With Zero-Cost Stack</h2>
          <p className="text-xs text-muted">Open source. Transparent. Free tier everything.</p>
        </div>
        <div className="flex items-center justify-center gap-6 flex-wrap text-xs font-mono text-muted">
          <span className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">Next.js 15</span>
          <span className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">Supabase</span>
          <span className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">Tailwind CSS</span>
          <span className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">Recharts</span>
          <span className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">SHA-256</span>
          <span className="px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">Vercel</span>
        </div>
      </section>
    </div>
  );
}
