// vite.config.ts
import { defineConfig } from "file:///home/dsmmcken/git/deephaven-plugins/node_modules/vite/dist/node/index.js";
import react from "file:///home/dsmmcken/git/deephaven-plugins/node_modules/@vitejs/plugin-react-swc/index.js";
var vite_config_default = defineConfig(({ mode }) => ({
  build: {
    minify: false,
    outDir: "dist/bundle",
    lib: {
      entry: "./src/index.ts",
      fileName: () => "index.js",
      formats: ["cjs"]
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "redux",
        "react-redux",
        "@deephaven/jsapi-bootstrap",
        "@deephaven/log",
        "@deephaven/components",
        "@deephaven/dashboard",
        "@deephaven/dashboard-core-plugins",
        "@deephaven/icons",
        "@deephaven/plugin",
        "@deephaven/utils"
      ]
    }
  },
  define: mode === "production" ? { "process.env.NODE_ENV": '"production"' } : {},
  plugins: [react()]
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9kc21tY2tlbi9naXQvZGVlcGhhdmVuLXBsdWdpbnMvcGx1Z2lucy90cmFkaW5ndmlldy1saWdodHdlaWdodC9zcmMvanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL2RzbW1ja2VuL2dpdC9kZWVwaGF2ZW4tcGx1Z2lucy9wbHVnaW5zL3RyYWRpbmd2aWV3LWxpZ2h0d2VpZ2h0L3NyYy9qcy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9kc21tY2tlbi9naXQvZGVlcGhhdmVuLXBsdWdpbnMvcGx1Z2lucy90cmFkaW5ndmlldy1saWdodHdlaWdodC9zcmMvanMvdml0ZS5jb25maWcudHNcIjsvKiBlc2xpbnQtZGlzYWJsZSBpbXBvcnQvbm8tZXh0cmFuZW91cy1kZXBlbmRlbmNpZXMgKi9cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0LXN3Yyc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBidWlsZDoge1xuICAgIG1pbmlmeTogZmFsc2UsXG4gICAgb3V0RGlyOiAnZGlzdC9idW5kbGUnLFxuICAgIGxpYjoge1xuICAgICAgZW50cnk6ICcuL3NyYy9pbmRleC50cycsXG4gICAgICBmaWxlTmFtZTogKCkgPT4gJ2luZGV4LmpzJyxcbiAgICAgIGZvcm1hdHM6IFsnY2pzJ10sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogW1xuICAgICAgICAncmVhY3QnLFxuICAgICAgICAncmVhY3QtZG9tJyxcbiAgICAgICAgJ3JlZHV4JyxcbiAgICAgICAgJ3JlYWN0LXJlZHV4JyxcbiAgICAgICAgJ0BkZWVwaGF2ZW4vanNhcGktYm9vdHN0cmFwJyxcbiAgICAgICAgJ0BkZWVwaGF2ZW4vbG9nJyxcbiAgICAgICAgJ0BkZWVwaGF2ZW4vY29tcG9uZW50cycsXG4gICAgICAgICdAZGVlcGhhdmVuL2Rhc2hib2FyZCcsXG4gICAgICAgICdAZGVlcGhhdmVuL2Rhc2hib2FyZC1jb3JlLXBsdWdpbnMnLFxuICAgICAgICAnQGRlZXBoYXZlbi9pY29ucycsXG4gICAgICAgICdAZGVlcGhhdmVuL3BsdWdpbicsXG4gICAgICAgICdAZGVlcGhhdmVuL3V0aWxzJyxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbiAgZGVmaW5lOlxuICAgIG1vZGUgPT09ICdwcm9kdWN0aW9uJyA/IHsgJ3Byb2Nlc3MuZW52Lk5PREVfRU5WJzogJ1wicHJvZHVjdGlvblwiJyB9IDoge30sXG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsTUFDUCxVQUFVLE1BQU07QUFBQSxNQUNoQixTQUFTLENBQUMsS0FBSztBQUFBLElBQ2pCO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsUUFDUjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUNFLFNBQVMsZUFBZSxFQUFFLHdCQUF3QixlQUFlLElBQUksQ0FBQztBQUFBLEVBQ3hFLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDbkIsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
