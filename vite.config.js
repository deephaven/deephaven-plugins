// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig, loadEnv } from 'vite';

const DEFAULT_PORT = 4100;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const port = Number(env.PORT || process.env.PORT || DEFAULT_PORT);

  // This config doesn't build anything, it just serves the files from the
  // plugins directory
  return {
    publicDir: 'plugins',
    server: {
      port,
    },
  };
});
