'use client';

/**
 * Session context — loads the authenticated SessionUser (via GET /auth/me),
 * tracks the active school, and persists the school scope so apiFetch sends the
 * right `x-school-id`. Wrap the dashboard tree in <SessionProvider>.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@schoolbridge/types';
import { apiFetch, ApiError } from './api';
import { getSchoolId, setSchoolId as persistSchoolId, clearSession, isAuthenticated } from './auth';

interface SessionContextValue {
  user: SessionUser | null;
  loading: boolean;
  /** The active school id (also written to localStorage for apiFetch). */
  schoolId: string | null;
  /** The active membership (school + role), if resolvable. */
  activeMembership: SessionUser['memberships'][number] | null;
  /** True when the user holds a SUPER_ADMIN role on any school (platform-wide). */
  isSuperAdmin: boolean;
  /** True for a SUPER_ADMIN with no school-scoped role — platform-only experience. */
  isPlatformOnly: boolean;
  /** True when the user has at least one non-SUPER_ADMIN (school-scoped) membership. */
  hasSchoolAccess: boolean;
  setSchoolId: (id: string) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolIdState] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    apiFetch<SessionUser>('/auth/me')
      .then((me) => {
        if (cancelled) return;
        setUser(me);

        // Resolve active school: persisted choice if still valid, else first membership.
        const persisted = getSchoolId();
        const valid = me.memberships.find((m) => m.schoolId === persisted);
        const resolved = valid?.schoolId ?? me.memberships[0]?.schoolId ?? null;
        if (resolved) {
          persistSchoolId(resolved);
          setSchoolIdState(resolved);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearSession();
          router.replace('/login');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const setSchoolId = useCallback((id: string) => {
    persistSchoolId(id);
    setSchoolIdState(id);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    router.push('/login');
  }, [router]);

  const value = useMemo<SessionContextValue>(() => {
    const activeMembership =
      user?.memberships.find((m) => m.schoolId === schoolId) ?? user?.memberships[0] ?? null;
    const isSuperAdmin = user?.memberships.some((m) => m.role === 'SUPER_ADMIN') ?? false;
    const hasSchoolAccess = user?.memberships.some((m) => m.role !== 'SUPER_ADMIN') ?? false;
    const isPlatformOnly = isSuperAdmin && !hasSchoolAccess;
    return {
      user,
      loading,
      schoolId,
      activeMembership,
      isSuperAdmin,
      isPlatformOnly,
      hasSchoolAccess,
      setSchoolId,
      logout,
    };
  }, [user, loading, schoolId, setSchoolId, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
