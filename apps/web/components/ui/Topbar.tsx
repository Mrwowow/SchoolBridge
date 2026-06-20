'use client';

import { useState } from 'react';
import { Menu, Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { clsx } from 'clsx';
import { clearSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface School {
  id: string;
  name: string;
}

// TODO: replace with real schools from SessionUser.memberships
const MOCK_SCHOOLS: School[] = [
  { id: 'sch_001', name: 'Greenfield Academy' },
  { id: 'sch_002', name: 'Kings College Prep' },
];

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const router = useRouter();
  const [activeSchool, setActiveSchool] = useState<School>(MOCK_SCHOOLS[0]!);
  const [schoolDropdown, setSchoolDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-100 bg-white px-4 sm:px-6">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* School switcher */}
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
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
          {activeSchool.name}
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {schoolDropdown && (
          <div
            className="absolute left-0 top-full z-50 mt-1.5 min-w-52 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
            role="listbox"
            aria-label="Switch school"
          >
            {MOCK_SCHOOLS.map((school) => (
              <button
                key={school.id}
                role="option"
                aria-selected={school.id === activeSchool.id}
                onClick={() => {
                  setActiveSchool(school);
                  setSchoolDropdown(false);
                  // TODO: setSchoolId(school.id) and refetch queries
                }}
                className={clsx(
                  'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-50',
                  school.id === activeSchool.id
                    ? 'font-medium text-brand-700'
                    : 'text-gray-700',
                )}
              >
                {school.id === activeSchool.id && (
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
                )}
                {school.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <button
        type="button"
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {/* TODO: badge when unread count > 0 */}
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" aria-hidden />
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
          {/* TODO: replace initials with SessionUser.fullName */}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            AD
          </span>
          <span className="hidden sm:block">Admin</span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {userDropdown && (
          <div
            className="absolute right-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg"
            role="menu"
          >
            <button
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
              onClick={() => {
                setUserDropdown(false);
                // TODO: navigate to profile settings
              }}
            >
              <User size={15} className="text-gray-400" />
              My Profile
            </button>
            <hr className="my-1 border-gray-100" />
            <button
              role="menuitem"
              onClick={handleLogout}
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
