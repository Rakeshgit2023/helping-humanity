import { create } from 'zustand';

import { STORAGE_KEYS } from '@/constants/config';
import { authService } from '@/features/auth/services/auth.service';
import type { AuthUser, LoginPayload, RegisterPayload } from '@/features/auth/types/auth.types';
import { secureStorage } from '@/services/storage/secureStorage';
import { toAppError } from '@/utils/errorHandler';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  restoreSession: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

async function persistSession(
  user: AuthUser,
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await secureStorage.setItem(STORAGE_KEYS.accessToken, accessToken);
  await secureStorage.setItem(STORAGE_KEYS.refreshToken, refreshToken);
  await secureStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

async function clearSession(): Promise<void> {
  await secureStorage.removeItem(STORAGE_KEYS.accessToken);
  await secureStorage.removeItem(STORAGE_KEYS.refreshToken);
  await secureStorage.removeItem(STORAGE_KEYS.user);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  restoreSession: async () => {
    set({ status: 'loading' });
    const [accessToken, storedUser] = await Promise.all([
      secureStorage.getItem(STORAGE_KEYS.accessToken),
      secureStorage.getItem(STORAGE_KEYS.user),
    ]);

    if (!accessToken || !storedUser) {
      await clearSession();
      set({ status: 'unauthenticated' });
      return;
    }

    try {
      const user = JSON.parse(storedUser) as AuthUser;
      set({ user, status: 'authenticated', error: null });
    } catch {
      await clearSession();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  login: async (payload) => {
    set({ status: 'loading', error: null });
    try {
      const { user, accessToken, refreshToken } = await authService.login(payload);
      await persistSession(user, accessToken, refreshToken);
      set({ user, status: 'authenticated' });
    } catch (error) {
      set({ status: 'unauthenticated', error: toAppError(error).message });
      throw error;
    }
  },

  register: async (payload) => {
    set({ status: 'loading', error: null });
    try {
      await authService.register(payload);
      set({ status: 'unauthenticated' });
    } catch (error) {
      set({ status: 'unauthenticated', error: toAppError(error).message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network failures during logout; local session is cleared regardless.
    }
    await clearSession();
    set({ user: null, status: 'unauthenticated', error: null });
  },
}));
