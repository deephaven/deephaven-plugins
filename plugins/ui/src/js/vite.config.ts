/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  build: {
    minify: false,
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
        '@deephaven/chart',
        '@deephaven/components',
        '@deephaven/console',
        '@deephaven/dashboard',
        '@deephaven/dashboard-core-plugins',
        '@deephaven/icons',
        '@deephaven/iris-grid',
        '@deephaven/jsapi-bootstrap',
        '@deephaven/jsapi-components',
        '@deephaven/log',
        '@deephaven/plugin',
      ],
    },
  },
  define:
    mode === 'production' ? { 'process.env.NODE_ENV': '"production"' } : {},
  plugins: [react()],
}));
