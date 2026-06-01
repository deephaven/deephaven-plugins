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
      output: {
        exports: 'named',
      },
      // Externalize peer deps following the grid-toolbar pattern.
      // These are provided at runtime by DHE's remote-component.config.ts
      // resolve map (or by the loaded js-plugin-pivot bundle in DHE's
      // plugin loader). `fast-deep-equal` is not in DHE's resolve map,
      // so we let it bundle.
      external: [
        'react',
        'react-dom',
        '@deephaven/components',
        '@deephaven/dashboard',
        '@deephaven/dashboard-core-plugins',
        '@deephaven/iris-grid',
        '@deephaven/jsapi-bootstrap',
        '@deephaven/jsapi-types',
        '@deephaven/jsapi-utils',
        '@deephaven/js-plugin-pivot',
        '@deephaven/log',
        '@deephaven/plugin',
        '@dnd-kit/core',
        '@dnd-kit/sortable',
        '@dnd-kit/utilities',
      ],
    },
  },
  define:
    mode === 'production' ? { 'process.env.NODE_ENV': '"production"' } : {},
  plugins: [react()],
}));
