import { create } from 'zustand';
import { authApi } from '@/api/auth';
import { getToken, setToken, removeToken } from '@/utils/token';
import type { UserVO, LoginDTO } from '@/types/auth';

interface AuthState {
  token: string | null;
  user: UserVO | null;
  login: (data: LoginDTO) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  user: null,

  login: async (data: LoginDTO) => {
    const result = await authApi.login(data);
    setToken(result.token);
    set({ token: result.token, user: result.user });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      removeToken();
      set({ token: null, user: null });
    }
  },

  restoreSession: async () => {
    const token = getToken();
    if (!token) {
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