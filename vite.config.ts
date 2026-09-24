import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { configDefaults } from "vitest/config";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(({ mode }) => {
  // Load .env / .env.development / .env.development.local into a local map.
  // process.env is NOT populated from these files in vite.config.ts, so we
  // must use loadEnv to read VITE_* vars when configuring the proxy target.
  const env = loadEnv(mode, process.cwd(), "");

  return {
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target:
      process.env.TAURI_ENV_PLATFORM === 'windows'
        ? 'chrome111'
        : 'safari16.4',
    // don't minify for debug builds
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  server: {
    host: host || "::",
    port: 8080,
    cors: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    },
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
    proxy: (() => {
      // Always proxy /api, /healthz, and /readyz through the Vite dev server so
      // the browser never makes cross-origin requests (which would require the
      // remote UAR to emit CORS headers). Server-to-server traffic is not subject
      // to the Same-Origin Policy.
      //
      // Target priority:
      //   1. VITE_UAR_BASE_URL from .env files (e.g. https://uar.know-me.tools)
      //   2. Local UAR instance on port 6565
      const target = env.VITE_UAR_BASE_URL || "http://127.0.0.1:6565";
      const opts = { target, changeOrigin: true, secure: false };
      return {
        "/api": opts,
        "/healthz": opts,
        "/readyz": opts,
      };
    })(),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // PGLite loads pglite.data and pglite.wasm via `new URL("./...", import.meta.url)`
  // relative to its own dist folder. If Vite pre-bundles it, those paths resolve to
  // .vite/deps/ instead, causing a 404 → "Invalid FS bundle size" crash.
  // Excluding it here keeps the files served from node_modules as-is.
  optimizeDeps: {
    exclude: ["@electric-sql/pglite"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: [...configDefaults.exclude, "src/test/*.integration.test.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  };
});
