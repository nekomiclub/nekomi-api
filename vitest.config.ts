import { defineConfig } from 'vitest/config';



export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globalSetup: './src/vitest.globalSetup.ts',
    setupFiles: ['./src/services/openapi/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
    ]
  }
});