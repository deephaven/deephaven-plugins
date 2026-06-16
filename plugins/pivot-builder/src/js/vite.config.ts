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
      //
      // TODO: `@dnd-kit/*` and `@fortawesome/react-fontawesome` are bundled for
      // now. Once a web-client-ui release re-exports them from
      // `@deephaven/iris-grid` / `@deephaven/components`, switch the plugin
      // to import from those packages and externalize them again.
      external: [
        'react',
        'react-dom',
        '@deephaven/components',
        '@deephaven/dashboard',
        '@deephaven/dashboard-core-plugins',
        '@deephaven/icons',
        '@deephaven/iris-grid',
        '@deephaven/jsapi-bootstrap',
        '@deephaven/jsapi-types',
        '@deephaven/jsapi-utils',
        '@deephaven/js-plugin-pivot',
        '@deephaven/log',
        '@deephaven/plugin',
        '@deephaven/react-hooks',
      ],
    },
  },
  define:
    mode === 'production' ? { 'process.env.NODE_ENV': '"production"' } : {},
  plugins: [react()],
}));
