'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import clsx from 'clsx';
import { adminPost } from '@/lib/admin-client';

const navItems = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: (
      <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    label: 'Tests',
    href: '/admin/tests',
    icon: (
      <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M5 8h14M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"/>
      </svg>
    ),
  },
  {
    label: 'Questions',
    href: '/admin/questions',
    icon: (
      <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01"/>
        <circle cx="12" cy="12" r="9"/>
      </svg>
    ),
  },
  {
    label: 'Students',
    href: '/admin/students',
    icon: (
      <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20H7a4 4 0 01-4-4v-.5A4.5 4.5 0 017.5 11h9a4.5 4.5 0 014.5 4.5V16a4 4 0 01-4 4zM12 3a4 4 0 100 8 4 4 0 000-8z"/>
      </svg>
    ),
  },
  {
    label: 'Import / Export',
    href: '/admin/import-export',
    icon: (
      <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 12l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
    ),
  },
];

export interface AdminSidebarProps {
  username: string;
}

export function AdminSidebar({ username }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await adminPost('/api/admin/auth/logout');
      router.push('/admin');
      router.refresh();
    } catch {
      setBusy(false);
    }
  };

  return (
    <aside className="sticky top-0 flex h-screen w-56 flex-none flex-col border-r border-border-subtle bg-surface">
      {/* Branding */}
      <div className="border-b border-border-subtle px-4 py-4">
        <Link href="/admin/dashboard">
          <div className="text-sm font-bold text-text-primary">SAT Simulator</div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
              ADMIN
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-accent-subtle text-accent'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  )}
                >
                  <span className={clsx('flex-none', active ? 'text-accent' : 'text-text-muted')}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-border-subtle px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-subtle text-xs font-bold text-accent">
                {username.slice(0, 1).toUpperCase()}
              </div>
              <span className="truncate text-xs font-medium text-text-primary">{username}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            title="Sign out"
            className="flex-none rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary disabled:opacity-40"
          >
            <svg aria-hidden className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
