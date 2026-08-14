import { http, BASE_URL } from './request';
import { ApiError } from './request';
import type { UserVO, LoginDTO, LoginResultVO, SetupDTO, ResetPasswordDTO } from '@/types/auth';

/** 登录响应（包含特殊状态码 1001/1002） */
interface LoginResponse {
  code: number;
  data: { token?: string; temp_token?: string } | null;
  message: string;
}

export const authApi = {
  /** 登录：返回原始响应（code 可能是 0/1001/1002/401） */
  login: async (data: LoginDTO): Promise<LoginResponse> => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  /** 首次设置用户名和密码 */
  setup: (data: SetupDTO) =>
    http.post<LoginResultVO>('/auth/setup', data),

  /** 重置密码后设置新密码 */
  resetPassword: (data: ResetPasswordDTO) =>
    http.post<LoginResultVO>('/auth/reset-password', data),

  /** 获取当前用户信息 */
  profile: () =>
    http.get<UserVO>('/auth/profile'),

  /** 登出 */
  logout: () =>
    http.post<null>('/auth/logout'),
};

export { ApiError };
