// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig, loadEnv } from 'vite';

const DEFAULT_PORT = 4100;

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  const port = Number(env.PORT || process.env.PORT || DEFAULT_PORT);
  const strictPort = (env.STRICT_PORT || process.env.STRICT_PORT) === 'true';

  // This config doesn't build anything, it just serves the files from the
  // plugins directory
  return {
    publicDir: 'plugins',
    server: {
      port,
      strictPort,
    },
  };
});
