import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ mode }) => ({
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target:
      process.env.TAURI_ENV_PLATFORM === 'windows'
        ? 'chrome105'
        : 'safari13',
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  server: {
    host: host || "::",
    port: 8080,
    hmr: host
    ? {
        protocol: 'ws',
        host,
        port: 1421,
      }
    : {
      overlay: false,
    },
    watch: {
      // tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:6565",
        changeOrigin: true,
      },
      "/healthz": {
        target: "http://127.0.0.1:6565",
        changeOrigin: true,
      },
      "/readyz": {
        target: "http://127.0.0.1:6565",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
