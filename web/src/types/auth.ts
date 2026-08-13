/** 用户信息 */
interface UserVO {
  id: number;
  email: string;
  name: string;
  avatar?: string;
}

/** 登录请求体 */
interface LoginDTO {
  email: string;
  password: string;
}

/** 登录响应 */
interface LoginResultVO {
  token: string;
  user: UserVO;
}

export { type UserVO, type LoginDTO, type LoginResultVO };