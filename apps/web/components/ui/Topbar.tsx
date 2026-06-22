'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { useSession } from '@/lib/session';
import { apiFetch } from '@/lib/api';

interface TopbarProps {
  onMenuClick: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'Administrator',
  CLASS_TEACHER: 'Class Teacher',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
};

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, schoolId, setSchoolId, activeMembership, isPlatformOnly, logout } =
    useSession();
  const [schoolDropdown, setSchoolDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [schoolNames, setSchoolNames] = useState<Record<string, string>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  const memberships = user?.memberships ?? [];

  // Resolve human-readable school names for the switcher.
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      memberships.map((m) =>
        apiFetch<{ id: string; name: string }>(`/schools/${m.schoolId}`, { schoolId: m.schoolId })
          .then((s) => [m.schoolId, s.name] as const)
          .catch(() => [m.schoolId, m.schoolId.slice(0, 8)] as const),
      ),
    ).then((pairs) => {
      if (!cancelled) setSchoolNames(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Poll the unread-notification count.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      apiFetch<{ count: number }>('/notifications/unread-count')
        .then((r) => !cancelled && setUnreadCount(r.count))
        .catch(() => undefined);
    load();
    const t = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const initials = (user?.fullName ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const activeSchoolName = schoolId ? schoolNames[schoolId] ?? '…' : 'No school';

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* School switcher — hidden for platform-only super admins, who operate
          across all schools rather than within one. */}
      {!isPlatformOnly && (
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setSchoolDropdown((v) => !v);
            setUserDropdown(false);
          }}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          aria-haspopup="listbox"
          aria-expanded={schoolDropdown}
          disabled={memberships.length === 0}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          {activeSchoolName}
          {memberships.length > 1 && <ChevronDown size={14} className="text-gray-400" />}
        </button>

        {schoolDropdown && memberships.length > 0 && (
          <div
            className="absolute left-0 top-full z-50 mt-1.5 min-w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
            role="listbox"
            aria-label="Switch school"
          >
            {memberships.map((m) => (
              <button
                key={m.schoolId}
                role="option"
                aria-selected={m.schoolId === schoolId}
                onClick={() => {
                  setSchoolId(m.schoolId);
                  setSchoolDropdown(false);
                }}
                className={clsx(
                  'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50',
                  m.schoolId === schoolId ? 'font-medium text-brand-700' : 'text-gray-700',
                )}
              >
                {m.schoolId === schoolId && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
                )}
                <span className="flex flex-col">
                  <span>{schoolNames[m.schoolId] ?? m.schoolId.slice(0, 8)}</span>
                  <span className="text-xs text-gray-400">{ROLE_LABELS[m.role] ?? m.role}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      <div className="flex-1" />

      {/* Notifications */}
      <button
        type="button"
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* User menu */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setUserDropdown((v) => !v);
            setSchoolDropdown(false);
          }}
          className="flex items-center gap-2 rounded-xl p-1.5 pr-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
          aria-haspopup="menu"
          aria-expanded={userDropdown}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {initials}
          </span>
          <span className="hidden sm:block">{user?.fullName ?? 'Account'}</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {userDropdown && (
          <div
            className="absolute right-0 top-full z-50 mt-1.5 w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
            role="menu"
          >
            <div className="px-4 py-2.5 text-xs text-gray-400">
              {activeMembership ? ROLE_LABELS[activeMembership.role] ?? activeMembership.role : ''}
              {user?.phone ? ` · ${user.phone}` : ''}
            </div>
            <hr className="my-1 border-gray-100" />
            <button
              role="menuitem"
              onClick={logout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
