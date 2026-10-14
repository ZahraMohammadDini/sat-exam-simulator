'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import clsx from 'clsx';
import { adminPost } from '@/lib/admin-client';

export interface AdminSidebarProps {
  username: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const NAV: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '▤' },
  { href: '/admin/tests', label: 'Tests', icon: '☰' },
  { href: '/admin/questions', label: 'Question Bank', icon: '?' },
  { href: '/admin/students', label: 'Students', icon: '☺' },
  { href: '/admin/import-export', label: 'Import / Export', icon: '⇅' },
];

export function AdminSidebar({ username }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await adminPost('/api/auth/logout');
      router.push('/admin');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-none flex-col border-r border-border-subtle bg-surface">
      <div className="border-b border-border-subtle px-4 py-4">
        <Link href="/admin/dashboard" className="block">
          <div className="text-base font-bold text-text-primary">SAT Admin</div>
          <div className="text-xs text-text-muted">Exam simulator</div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-accent-subtle text-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              )}
            >
              <span aria-hidden className="w-4 text-center">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border-subtle p-3">
        <div className="mb-2 px-3 text-xs text-text-muted">
          Signed in as <strong className="text-text-primary">{username}</strong>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-50"
        >
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
