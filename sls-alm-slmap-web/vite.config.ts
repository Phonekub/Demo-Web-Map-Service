/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
    exclude: ['node_modules', 'dist', 'coverage', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coveragereport',
      include: ['src/**/*.{tsx,js,jsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.{ts,tsx,js,jsx}',
        'src/components/basemap',
        'src/**/__mocks__/**',
        'src/**/*.json',
        'src/**/*.css',
        'src/**/*.scss',
        'src/**/*.less',
        'src/**/*.sass',
      ],
    },
  },
});
