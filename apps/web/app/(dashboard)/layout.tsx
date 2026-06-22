'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/ui/Sidebar';
import { Topbar } from '@/components/ui/Topbar';
import { SessionProvider, useSession } from '@/lib/session';

/** Routes a platform-only super admin is allowed to see. */
const PLATFORM_PREFIXES = ['/dashboard/platform', '/dashboard/schools', '/dashboard/plans'];

function isPlatformRoute(pathname: string) {
  return PLATFORM_PREFIXES.some((p) => pathname.startsWith(p));
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { loading, isPlatformOnly } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // A platform-only super admin cannot reach school-scoped pages.
  const blocked = !loading && isPlatformOnly && !isPlatformRoute(pathname);

  useEffect(() => {
    if (blocked) router.replace('/dashboard/platform');
  }, [blocked, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />

        <main
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8"
          id="main-content"
        >
          {loading || blocked ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Loading…
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardShell>{children}</DashboardShell>
    </SessionProvider>
  );
}
