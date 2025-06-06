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
        // Externalize all Deephaven dependencies to reduce bundle size and maintain proper context for themes, etc.
        '@deephaven/components',
        '@deephaven/icons',
        '@deephaven/iris-grid',
        '@deephaven/jsapi-bootstrap',
        '@deephaven/jsapi-utils',
        '@deephaven/log',
        '@deephaven/plugin',
      ],
    },
  },
  define:
    mode === 'production' ? { 'process.env.NODE_ENV': '"production"' } : {},
  plugins: [react()],
}));
