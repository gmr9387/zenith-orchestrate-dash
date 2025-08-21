import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    watch: false,
    include: ['tests/**/*.test.ts'],
  },
});