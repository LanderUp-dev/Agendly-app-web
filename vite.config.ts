import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Em dev, /api é repassado ao Spring Boot: front e API ficam na mesma origem
  // e o navegador não faz requisições cross-origin (sem depender de CORS).
  const apiTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8080";

  return {
    plugins: [
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      tanstackStart(),
      // Build: Nitro gera um servidor Node em .output/server/index.mjs (porta via PORT, padrão 3000).
      // Nesta versão do TanStack Start a opção `target` não existe mais; o alvo é o Nitro.
      // Só no build: em dev o Nitro atenderia /api antes do proxy do Vite (404).
      command === "build" ? nitro({ preset: "node-server" }) : null,
      viteReact(),
    ],
    server: {
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
