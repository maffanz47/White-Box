'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home', icon: '◈' },
  { href: '/dashboard', label: 'Dashboard', icon: '◫' },
  { href: '/flow', label: 'Money Flow', icon: '◍' },
  { href: '/audit', label: 'Audit Trail', icon: '⬡' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="nav-glass sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-green to-accent-blue flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
              W
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">
                White<span className="text-accent-green">Box</span>
              </span>
              <span className="hidden sm:inline text-xs text-muted ml-2 font-mono">
                v1.0
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link px-3 py-2 text-sm font-medium rounded-lg hover:bg-white/5 transition-all ${
                  pathname === link.href ? 'active text-foreground' : ''
                }`}
              >
                <span className="mr-1.5 text-xs">{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Live Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent-green/20 bg-accent-green/5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
              <span className="text-xs font-mono text-accent-green">LIVE</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
