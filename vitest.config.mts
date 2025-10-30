import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['plugins/python-remote-file-source/test-node-client'],
  },
});
