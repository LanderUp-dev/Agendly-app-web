import { defineConfig } from "vitest/config";
import viteReact from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

// Config própria dos testes: não carrega o plugin do TanStack Start (SSR/servidor).
export default defineConfig({
  plugins: [tsConfigPaths({ projects: ["./tsconfig.json"] }), viteReact()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
