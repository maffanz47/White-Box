'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home', icon: '◈' },
  { href: '/dashboard', label: 'Donor Analytics', icon: '💙' },
  { href: '/flow', label: 'Money Flow', icon: '◍' },
  { href: '/audit', label: 'Audit Trail', icon: '⬡' },
  { href: '/admin', label: 'NGO Portal', icon: '🔐' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-green to-accent-blue flex items-center justify-center text-sm font-bold text-white">
              W
            </span>
            <span>WhiteBox</span>
            <span className="text-xs text-muted font-normal font-mono ml-1">v1.0</span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-foreground'
                      : 'text-muted hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-green to-accent-blue rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Live Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent-green/20 bg-accent-green/5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            <span className="text-xs font-mono text-accent-green">LIVE</span>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto gap-1 pb-2 -mx-4 px-4 scrollbar-hide">
          {navLinks.map((link) => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white/10 text-foreground'
                    : 'text-muted hover:text-foreground hover:bg-white/5'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
