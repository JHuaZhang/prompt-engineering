/** 用户角色 */
type UserRole = 'root' | 'admin' | 'user';

/** 用户状态 */
type UserStatus = 'pending_setup' | 'active' | 'password_reset';

/** 用户信息 */
interface UserVO {
  id: number;
  email: string;
  username: string | null;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  created_at?: string;
}

/** 登录请求体 */
interface LoginDTO {
  email: string;
  password: string;
}

/** 登录响应（正常） */
interface LoginResultVO {
  token: string;
  user: UserVO;
}

/** 首次设置请求体 */
interface SetupDTO {
  username: string;
  password: string;
}

/** 重置密码请求体 */
interface ResetPasswordDTO {
  new_password: string;
}

/** 用户管理列表项 */
interface UserManageVO {
  id: number;
  email: string;
  username: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string | null;
}

/** 创建用户请求体 */
interface CreateUserDTO {
  email: string;
}

/** 修改角色请求体 */
interface UpdateRoleDTO {
  role: UserRole;
}

export {
  type UserRole,
  type UserStatus,
  type UserVO,
  type LoginDTO,
  type LoginResultVO,
  type SetupDTO,
  type ResetPasswordDTO,
  type UserManageVO,
  type CreateUserDTO,
  type UpdateRoleDTO,
};
