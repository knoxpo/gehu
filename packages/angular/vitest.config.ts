import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test-setup.ts'],
  },
  // Resolve the `.js` specifiers in our ESM source to the `.ts` files.
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
});
