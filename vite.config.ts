import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    // CSS baseline: color-mix()/oklch requires Chrome 111 / Safari 16.2+; no need to
    // transpile JS for older engines.
    target: ["es2022", "chrome111", "safari16.2", "firefox113"],
    cssCodeSplit: true,
    // Target browsers all support native <link rel="modulepreload">; skip the polyfill.
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (!normalized.includes("/node_modules/")) return;

          if (
            /\/node_modules\/(?:react|react-dom|react-router|react-router-dom)\//.test(
              normalized,
            )
          ) {
            return "react";
          }
          if (normalized.includes("/node_modules/@tanstack/react-query/")) {
            return "query";
          }
          if (normalized.includes("/node_modules/zod/")) {
            return "validation";
          }
          // uplot (~55 KB) is only used on detail/history pages; split it so the home
          // page bundle stays lean and this chunk can be cached independently.
          if (normalized.includes("/node_modules/uplot")) {
            return "charts";
          }
          // lucide-react ships a large icon tree; isolate it so icon-set updates don't
          // bust the app chunk cache.
          if (normalized.includes("/node_modules/lucide-react/")) {
            return "icons";
          }
        },
      },
    },
  },
});
