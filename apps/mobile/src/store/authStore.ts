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

      if (accessToken) {
        set({
          accessToken,
          refreshToken,
          schoolId,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
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

    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
      resolvedSchoolId
        ? SecureStore.setItemAsync(KEYS.schoolId, resolvedSchoolId)
        : Promise.resolve(),
    ]);

    set({
      user,
      accessToken,
      refreshToken,
      schoolId: resolvedSchoolId,
      isAuthenticated: true,
      isLoading: false,
    });
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
    });
  },

  setTokens: async ({ accessToken, refreshToken }) => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
    ]);

    set({ accessToken, refreshToken });
  },
}));

/**
 * Non-hook accessor for the API client layer (called outside React tree).
 * Returns a snapshot — do NOT rely on reactivity.
 */
export function getAuthState(): {
  accessToken: string | null;
  schoolId: string | null;
} {
  const state = useAuthStore.getState();
  return { accessToken: state.accessToken, schoolId: state.schoolId };
}
