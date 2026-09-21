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
        '@deephaven/jsapi-bootstrap',
        '@deephaven/log',
        '@deephaven/components',
        '@deephaven/dashboard',
        '@deephaven/dashboard-core-plugins',
        '@deephaven/icons',
        '@deephaven/plugin',
        '@deephaven/utils',
      ],
    },
  },
  define:
    mode === 'production' ? { 'process.env.NODE_ENV': '"production"' } : {},
  plugins: [react()],
}));
