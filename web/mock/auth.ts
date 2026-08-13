import type { MockMethod } from 'vite-plugin-mock';

const MOCK_USER = {
  id: 1,
  email: 'admin@prompt.dev',
  name: 'Admin',
};

const MOCK_TOKEN = 'mock-jwt-token-admin-2026';

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
] as MockMethod[];