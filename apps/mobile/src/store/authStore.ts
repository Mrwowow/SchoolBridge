/**
 * src/store/authStore.ts
 * Zustand store for authentication state.
 * Tokens are persisted to expo-secure-store; user session is held in memory.
 *
 * Usage:
 *   const { user, isAuthenticated } = useAuthStore();
 *   const login = useAuthStore((s) => s.login);
 *
 * For the API client (which cannot use hooks) call getAuthState() directly.
 */
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import type { SessionUser } from '@schoolbridge/types';
// NOTE: `authApi` is intentionally NOT imported at module scope. The API client
// imports this store (for getAuthState / setTokens / logout), so a static import
// here would form a load-time circular dependency that Metro resolves to
// `undefined`, breaking unrelated routes. It is required lazily inside hydrate()
// instead, where the binding is fully initialised by call time.

const KEYS = {
  accessToken: 'sb_access_token',
  refreshToken: 'sb_refresh_token',
  schoolId: 'sb_school_id',
} as const;

interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Active school tenant — derived from first membership or stored preference */
  schoolId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Call on app launch to rehydrate tokens from secure storage */
  hydrate: () => Promise<void>;

  login: (params: {
    user: SessionUser;
    accessToken: string;
    refreshToken: string;
    schoolId?: string;
  }) => Promise<void>;

  logout: () => Promise<void>;

  setTokens: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  schoolId: null,
  isAuthenticated: false,
  isLoading: true,

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, schoolId] = await Promise.all([
        SecureStore.getItemAsync(KEYS.accessToken),
        SecureStore.getItemAsync(KEYS.refreshToken),
        SecureStore.getItemAsync(KEYS.schoolId),
      ]);

      if (!accessToken) {
        set({ isLoading: false });
        return;
      }

      // Put tokens in memory first so the /auth/me request below is authorised.
      set({ accessToken, refreshToken, schoolId });

      // The user object is in-memory only, so it must be re-fetched on launch —
      // otherwise role-derivation falls back to the wrong default after a cold
      // start. authApi.me() rides the client's 401→refresh path, so an expired
      // access token is transparently renewed here. Required lazily to avoid the
      // store ↔ api/client circular import (see note at top of file).
      const { authApi } = require('../api/auth') as typeof import('../api/auth');
      const user = await authApi.me().catch(() => null);

      if (user) {
        set({
          user,
          // schoolId may have been stale; keep stored choice if still a member.
          schoolId: user.memberships.some((m) => m.schoolId === schoolId)
            ? schoolId
            : user.memberships[0]?.schoolId ?? schoolId,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Token invalid/expired and refresh failed → treat as signed out.
        await get().logout();
        set({ isLoading: false });
      }
    } catch (err) {
      console.warn('[AuthStore] hydrate error', err);
      set({ isLoading: false });
    }
  },

  login: async ({ user, accessToken, refreshToken, schoolId }) => {
    // Derive schoolId from first membership if not explicitly provided
    const resolvedSchoolId =
      schoolId ?? user.memberships[0]?.schoolId ?? null;

    // Flip in-memory auth state FIRST so the AuthGate redirects immediately,
    // even if secure storage is slow or unavailable (e.g. some simulators).
    set({
      user,
      accessToken,
      refreshToken,
      schoolId: resolvedSchoolId,
      isAuthenticated: true,
      isLoading: false,
    });

    // Persist best-effort; a storage failure must not block sign-in.
    try {
      await Promise.all([
        SecureStore.setItemAsync(KEYS.accessToken, accessToken),
        SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
        resolvedSchoolId
          ? SecureStore.setItemAsync(KEYS.schoolId, resolvedSchoolId)
          : Promise.resolve(),
      ]);
    } catch (err) {
      console.warn('[AuthStore] failed to persist session', err);
    }
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
      SecureStore.deleteItemAsync(KEYS.refreshToken),
      SecureStore.deleteItemAsync(KEYS.schoolId),
    ]);

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      schoolId: null,
      isAuthenticated: false,
      // Always clear the loading gate so the AuthGate can redirect to /login
      // even if logout races an in-flight hydrate.
      isLoading: false,
    });
  },

  setTokens: async ({ accessToken, refreshToken }) => {
    // Set in memory first so getAuthState() (used by the API client) sees the
    // token immediately for the follow-up /auth/me request.
    set({ accessToken, refreshToken });

    try {
      await Promise.all([
        SecureStore.setItemAsync(KEYS.accessToken, accessToken),
        SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
      ]);
    } catch (err) {
      console.warn('[AuthStore] failed to persist tokens', err);
    }
  },
}));

/**
 * Non-hook accessor for the API client layer (called outside React tree).
 * Returns a snapshot — do NOT rely on reactivity.
 */
export function getAuthState(): {
  accessToken: string | null;
  refreshToken: string | null;
  schoolId: string | null;
} {
  const state = useAuthStore.getState();
  return {
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    schoolId: state.schoolId,
  };
}
