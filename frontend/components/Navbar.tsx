'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Car, LayoutDashboard, CalendarPlus, GraduationCap, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '@/lib/auth-store';

const LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/book-lesson', label: 'Rezervo Orë', icon: CalendarPlus },
  { href: '/quiz', label: 'Testi i Teorisë', icon: GraduationCap },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-bold text-brand-600">
          <Car size={20} />
          <span>Autoshkolla</span>
        </div>

        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === href ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-surface-muted'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-ink-muted sm:inline">{user?.emri}</span>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-surface-muted"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Dil</span>
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-border-subtle px-4 py-2 sm:hidden">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
              pathname === href ? 'bg-brand-50 text-brand-700' : 'text-ink-muted'
            )}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
