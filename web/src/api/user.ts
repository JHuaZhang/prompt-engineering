import { http } from './request';
import type { UserManageVO, CreateUserDTO, UpdateRoleDTO } from '@/types/auth';

export const userApi = {
  /** 用户列表 */
  list: () =>
    http.get<UserManageVO[]>('/users'),

  /** 创建用户（邮箱） */
  create: (data: CreateUserDTO) =>
    http.post<UserManageVO>('/users', data),

  /** 修改用户角色 */
  updateRole: (userId: number, data: UpdateRoleDTO) =>
    http.put<UserManageVO>(`/users/${userId}/role`, data),

  /** 重置用户密码 */
  resetPassword: (userId: number) =>
    http.post<null>(`/users/${userId}/reset-password`),

  /** 删除用户 */
  remove: (userId: number) =>
    http.delete<null>(`/users/${userId}`),
};
