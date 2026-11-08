#!/usr/bin/env node
/**
 * npm run test:e2e
 *  1. (opcional) sobe o lab: compose do Agendly-api e deste frontend (E2E_SUBIR_LAB=0 para pular)
 *  2. espera a baseUrl responder (Nginx + API)
 *  3. limpa resultados antigos e roda o Cypress (sem parar na primeira falha)
 *  4. gera cypress/reports/html e docs/relatorio-testes.md
 * Sai com o código do Cypress (falhas aparecem no relatório, não são escondidas).
 *
 * Variáveis: CYPRESS_BASE_URL (padrão http://localhost:8080), CYPRESS_USER_EMAIL,
 * CYPRESS_USER_PASSWORD, E2E_SUBIR_LAB (padrão 1).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const raiz = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
  "..",
);
const baseUrl = process.env.CYPRESS_BASE_URL || "http://localhost:8080";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";

const rodar = (cmd, args, opcoes = {}) => {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  return spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: raiz,
    shell: process.platform === "win32",
    ...opcoes,
  });
};

if (!process.env.CYPRESS_USER_EMAIL || !process.env.CYPRESS_USER_PASSWORD) {
  if (!fs.existsSync(path.join(raiz, "cypress.env.json"))) {
    console.error(
      "Defina CYPRESS_USER_EMAIL e CYPRESS_USER_PASSWORD (ou crie cypress.env.json a partir do exemplo).",
    );
    process.exit(2);
  }
}

if (process.env.E2E_SUBIR_LAB !== "0") {
  const api = rodar("docker", ["compose", "up", "-d", "--build"], {
    cwd: path.join(raiz, "..", "Agendly-api"),
  });
  if (api.status !== 0) process.exit(api.status ?? 1);
  const web = rodar("docker", ["compose", "up", "-d", "--build"]);
  if (web.status !== 0) process.exit(web.status ?? 1);
}

// Espera Nginx + API (até 4 min)
const limite = Date.now() + 240_000;
let pronto = false;
while (Date.now() < limite) {
  try {
    const [pagina, api] = await Promise.all([
      fetch(`${baseUrl}/login`),
      fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
    ]);
    if (pagina.ok && api.status < 500) {
      pronto = true;
      break;
    }
  } catch {
    /* ainda subindo */
  }
  await new Promise((r) => setTimeout(r, 3000));
}
if (!pronto) {
  console.error(`O lab não respondeu em ${baseUrl}. Veja "docker compose ps" e os logs.`);
  process.exit(1);
}

fs.rmSync(path.join(raiz, "cypress", "reports"), { recursive: true, force: true });
const cypress = rodar(npx, ["cypress", "run", "--browser", process.env.E2E_BROWSER || "electron"], {
  env: { ...process.env, CYPRESS_BASE_URL: baseUrl },
});
rodar(process.execPath, [path.join(raiz, "scripts", "relatorio-e2e.mjs")], { shell: false });
process.exit(cypress.status ?? 1);
