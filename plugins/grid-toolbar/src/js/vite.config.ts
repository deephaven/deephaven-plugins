/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
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
        'memoize-one',
        'lodash.throttle',
        '@deephaven/chart',
        '@deephaven/components',
        '@deephaven/grid',
        '@deephaven/icons',
        '@deephaven/iris-grid',
        '@deephaven/js-plugin-pivot',
        '@deephaven/jsapi-bootstrap',
        '@deephaven/jsapi-utils',
        '@deephaven/log',
        '@deephaven/plugin',
        '@deephaven/react-hooks',
        '@deephaven/utils',
      ],
    },
  },
  define:
    mode === 'production' ? { 'process.env.NODE_ENV': '"production"' } : {},
  plugins: [react()],
}));
