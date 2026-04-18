'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/dashboard', label: 'Donor Analytics' },
  { href: '/flow', label: 'Money Flow' },
  { href: '/audit', label: 'Audit Trail' },
  { href: '/admin', label: 'NGO Portal' },
  { href: '/how-it-works', label: 'How It Works' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">W</span>
          <span className="text-sm font-semibold text-zinc-100 tracking-tight">WhiteBox</span>
          <span className="text-xs text-zinc-600 font-mono hidden sm:block">v1.0</span>
        </Link>

        {/* Links — desktop */}
        <div className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white/8 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Live pill */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:block">LIVE</span>
        </div>
      </div>

      {/* Mobile scroll row */}
      <div className="md:hidden flex overflow-x-auto gap-0.5 pb-2 px-4">
        {navLinks.map((link) => {
          const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                active ? 'bg-white/8 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
