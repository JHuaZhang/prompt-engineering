import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import { viteMockServe } from 'vite-plugin-mock';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const useMock = process.env.VITE_USE_MOCK === 'true';

  // 开发环境后端地址（用于 proxy 代理）
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const apiPrefix = process.env.VITE_API_PREFIX || '/api/v1';

  return {
    plugins: [
      react(),
      checker({
        typescript: true,
      }),
      viteMockServe({
        mockPath: 'mock',
        enable: useMock,
        watchFiles: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        [apiPrefix]: {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
    },
  };
});