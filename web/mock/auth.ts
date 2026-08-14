import type { MockMethod } from 'vite-plugin-mock';

const MOCK_USER = {
  id: 1,
  email: 'admin@prompt.dev',
  username: 'Admin',
  role: 'root',
  status: 'active',
};

const MOCK_TOKEN = 'mock-jwt-token-admin-2026';

/** Mock 用户列表 */
const MOCK_USERS = [
  { id: 1, email: 'admin@prompt.dev', username: 'Admin', role: 'root', status: 'active', created_at: '2026-08-01 10:00:00' },
  { id: 2, email: 'user1@prompt.dev', username: '用户一', role: 'admin', status: 'active', created_at: '2026-08-05 14:30:00' },
  { id: 3, email: 'user2@prompt.dev', username: null, role: 'user', status: 'pending_setup', created_at: '2026-08-10 09:15:00' },
  { id: 4, email: 'user3@prompt.dev', username: '张三', role: 'user', status: 'password_reset', created_at: '2026-08-12 16:45:00' },
];

export default [
  {
    url: '/api/v1/auth/login',
    method: 'post',
    response: ({ body }: { body: { email: string; password: string } }) => {
      const { email, password } = body || {};
      if (email === 'admin@prompt.dev' && password === '123456') {
        return {
          code: 0,
          data: {
            token: MOCK_TOKEN,
            user: MOCK_USER,
          },
          message: 'success',
        };
      }
      return {
        code: 401,
        data: null,
        message: '邮箱或密码错误',
      };
    },
  },
  {
    url: '/api/v1/auth/setup',
    method: 'post',
    response: () => {
      return {
        code: 0,
        data: {
          token: MOCK_TOKEN,
          user: MOCK_USER,
        },
        message: '设置成功',
      };
    },
  },
  {
    url: '/api/v1/auth/reset-password',
    method: 'post',
    response: () => {
      return {
        code: 0,
        data: {
          token: MOCK_TOKEN,
          user: MOCK_USER,
        },
        message: '密码重置成功',
      };
    },
  },
  {
    url: '/api/v1/auth/logout',
    method: 'post',
    response: () => {
      return {
        code: 0,
        data: null,
        message: 'success',
      };
    },
  },
  {
    url: '/api/v1/auth/profile',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: MOCK_USER,
        message: 'success',
      };
    },
  },
  {
    url: '/api/v1/users',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: MOCK_USERS,
        message: 'success',
      };
    },
  },
  {
    url: '/api/v1/users',
    method: 'post',
    response: ({ body }: { body: { email: string } }) => {
      const newUser = {
        id: MOCK_USERS.length + 1,
        email: body.email,
        username: null,
        role: 'user',
        status: 'pending_setup',
        created_at: new Date().toLocaleString('zh-CN'),
      };
      MOCK_USERS.push(newUser);
      return {
        code: 0,
        data: newUser,
        message: '创建成功',
      };
    },
  },
  {
    url: '/api/v1/users/:id/role',
    method: 'put',
    response: () => {
      return {
        code: 0,
        data: null,
        message: '角色修改成功',
      };
    },
  },
  {
    url: '/api/v1/users/:id/reset-password',
    method: 'post',
    response: () => {
      return {
        code: 0,
        data: null,
        message: '密码已重置为 123456',
      };
    },
  },
  {
    url: '/api/v1/users/:id',
    method: 'delete',
    response: () => {
      return {
        code: 0,
        data: null,
        message: '删除成功',
      };
    },
  },
] as MockMethod[];