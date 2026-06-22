'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  ClipboardList,
  BarChart2,
  CreditCard,
  UserCog,
  Settings,
  Globe,
  Building2,
  TrendingUp,
  ScrollText,
} from 'lucide-react';
import { useSession } from '@/lib/session';
import { Logo } from './Logo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const SCHOOL_NAV: NavItem[] = [
  { label: 'Overview',   href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Pupils',     href: '/dashboard/pupils',     icon: Users },
  { label: 'Classes',    href: '/dashboard/classes',    icon: BookOpen },
  { label: 'Messages',   href: '/dashboard/messages',   icon: MessageSquare },
  { label: 'Attendance', href: '/dashboard/attendance', icon: ClipboardList },
  { label: 'Results',    href: '/dashboard/results',    icon: BarChart2 },
  { label: 'Fees',       href: '/dashboard/fees',       icon: CreditCard },
  { label: 'Analytics',  href: '/dashboard/analytics',  icon: TrendingUp },
  { label: 'Staff',      href: '/dashboard/staff',      icon: UserCog },
  { label: 'Audit Log',  href: '/dashboard/audit',      icon: ScrollText },
  { label: 'Settings',   href: '/dashboard/settings',   icon: Settings },
];

const PLATFORM_NAV: NavItem[] = [
  { label: 'Platform',   href: '/dashboard/platform',   icon: Globe },
  { label: 'Schools',    href: '/dashboard/schools',    icon: Building2 },
  { label: 'Plans',      href: '/dashboard/plans',      icon: CreditCard },
];

interface SidebarProps {
  /** Controlled open state for mobile overlay */
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isSuperAdmin, isPlatformOnly } = useSession();

  function renderItem({ label, href, icon: Icon }: NavItem) {
    const isActive =
      href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);
    return (
      <li key={href}>
        <Link
          href={href}
          onClick={onClose}
          className={clsx(
            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150',
            isActive
              ? 'bg-brand-50 text-brand-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          )}
          aria-current={isActive ? 'page' : undefined}
        >
          <Icon
            size={18}
            className={isActive ? 'text-brand-600' : 'text-gray-400'}
            aria-hidden
          />
          {label}
        </Link>
      </li>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-gray-100 bg-white',
          'transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-gray-100 px-5">
          <Logo kind="lockup" color="brand" height={44} priority />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" role="navigation">
          {isSuperAdmin && (
            <>
              <p className="px-3 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Platform
              </p>
              <ul className="mb-4 flex flex-col gap-0.5" role="list">
                {PLATFORM_NAV.map(renderItem)}
              </ul>
              {/* Platform-only super admins don't manage a single school. */}
              {!isPlatformOnly && (
                <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  School
                </p>
              )}
            </>
          )}
          {!isPlatformOnly && (
            <ul className="flex flex-col gap-0.5" role="list">
              {SCHOOL_NAV.map(renderItem)}
            </ul>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 px-3 py-4">
          <p className="px-3 text-xs text-gray-400">v0.1.0 — SchoolBridge</p>
        </div>
      </aside>
    </>
  );
}
