import MoneyFlowSankey from '@/components/MoneyFlowSankey';

export const metadata = {
  title: 'Money Flow — White Box',
  description: 'Visualize how donations flow from donors through NGOs to verified spending.',
};

export default function FlowPage() {
  return (
    <div className="bg-mesh min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Money Flow Map</h1>
          <p className="text-sm text-muted">
            Sankey diagram showing exactly how money moves from donations to verified impact
          </p>
        </div>

        {/* Flow Legend */}
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-center gap-8 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-green" />
                Public Donations Pool
              </span>
              <span className="text-muted font-mono">→</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-blue" />
                Verified NGOs
              </span>
              <span className="text-muted font-mono">→</span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-orange" />
                Expense Categories
              </span>
            </div>
          </div>
        </div>

        {/* Sankey Diagram */}
        <MoneyFlowSankey />

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="glass-card p-5">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">How It Works</div>
            <p className="text-sm text-foreground/80">
              Width of each flow represents the amount of money. 
              Wider flows = more money moving through that path.
            </p>
          </div>
          <div className="glass-card p-5">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Verification</div>
            <p className="text-sm text-foreground/80">
              Every flow shown here is backed by verified transactions. 
              Each has a SHA-256 hash in the audit log.
            </p>
          </div>
          <div className="glass-card p-5">
            <div className="text-xs text-muted uppercase tracking-wider mb-2">Categories</div>
            <p className="text-sm text-foreground/80">
              <strong>Direct Aid</strong> goes straight to beneficiaries. 
              <strong> Admin</strong> covers overhead. Lower admin = higher efficiency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
