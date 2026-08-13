import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import { viteMockServe } from 'vite-plugin-mock';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const useMock = process.env.VITE_USE_MOCK === 'true';

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
    },
  };
});