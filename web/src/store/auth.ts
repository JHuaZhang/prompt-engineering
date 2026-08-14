import { create } from 'zustand';
import { authApi } from '@/api/auth';
import {
  getToken,
  setToken,
  removeToken,
  setTempToken,
  removeTempToken,
} from '@/utils/token';
import type { UserVO, LoginDTO } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: UserVO | null;
  login: (data: LoginDTO) => Promise<{ code: number; message: string }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  user: null,

  login: async (data: LoginDTO) => {
    const result = await authApi.login(data);

    if (result.code === 0 && result.data?.token) {
      setToken(result.data.token);
      removeTempToken();
      // Fetch profile to get user info
      const user = await authApi.profile();
      set({ token: result.data.token, user });
      return { code: 0, message: 'success' };
    }

    if (result.code === 1001 && result.data?.temp_token) {
      setTempToken(result.data.temp_token);
      removeToken();
      return { code: 1001, message: result.message };
    }

    if (result.code === 1002 && result.data?.temp_token) {
      setTempToken(result.data.temp_token);
      removeToken();
      return { code: 1002, message: result.message };
    }

    // Auth failed
    throw new Error(result.message || '邮箱或密码错误');
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      removeToken();
      removeTempToken();
      set({ token: null, user: null });
    }
  },

  restoreSession: async () => {
    const token = getToken();
    if (!token) {
      removeTempToken();
      set({ token: null, user: null });
      return;
    }
    try {
      const user = await authApi.profile();
      set({ token, user });
    } catch {
      removeToken();
      set({ token: null, user: null });
    }
  },
}));

export { useAuthStore };
