/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    build: {
      minify: false,
      outDir: 'dist/bundle',
      lib: {
        entry: './src/index.ts',
        fileName: () => 'index.js',
        formats: ['cjs'],
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'redux',
          'react-redux',
          '@deephaven/components',
          '@deephaven/icons',
          '@deephaven/jsapi-bootstrap',
          '@deephaven/log',
          '@deephaven/plugin',
        ],
      },
    },
    define: {
      // Replace import.meta.env and process.env variables so these modules can be imported in the browser without issues
      'process.env.NODE_ENV': JSON.stringify(mode),
      __DEEPHAVEN_AG_GRID_LICENSE_KEY__: JSON.stringify(
        env.VITE_AG_GRID_LICENSE_KEY ?? ''
      ),
    },
    plugins: [react()],
  };
});
