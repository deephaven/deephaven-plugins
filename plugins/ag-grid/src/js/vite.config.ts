/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const isProduction = mode === 'production';
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
    define: isProduction
      ? {
          'process.env.NODE_ENV': '"production"',
          // Define this for production so it's baked into the build
          'import.meta.env.VITE_AG_GRID_LICENSE_KEY': JSON.stringify(
            env.VITE_AG_GRID_LICENSE_KEY ?? ''
          ),
        }
      : {},
    plugins: [react()],
  };
});
