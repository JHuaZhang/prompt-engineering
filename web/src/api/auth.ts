import { http } from './request';
import type { UserVO, LoginDTO, LoginResultVO } from '@/types/auth';

export const authApi = {
  login: (data: LoginDTO) =>
    http.post<LoginResultVO>('/auth/login', data),

  logout: () =>
    http.post<null>('/auth/logout'),

  profile: () =>
    http.get<UserVO>('/auth/profile'),
};