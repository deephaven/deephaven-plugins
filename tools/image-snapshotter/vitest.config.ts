import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // Anchor to this directory so vitest does not climb the parent tree and
  // try to load the repo-root vitest.config.mts (which lives outside our
  // node_modules and can't resolve `vitest`).
  root: here,
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
