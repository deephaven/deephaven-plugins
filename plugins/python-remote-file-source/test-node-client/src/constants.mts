import path from 'node:path';

export const SERVER_URL = new URL('http://localhost:10000/');
export const PSK = 'plugins.repo.test' as const;
export const TEST_WORKSPACE_PATH = path.resolve(
  import.meta.dirname,
  '../workspace'
);
