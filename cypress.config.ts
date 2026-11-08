import { defineConfig } from "cypress";
import fs from "node:fs";

/**
 * Testes E2E do Agendly.
 * - baseUrl: CYPRESS_BASE_URL (padrão: Nginx do lab em http://localhost:8080).
 * - Credenciais: CYPRESS_USER_EMAIL / CYPRESS_USER_PASSWORD (ou cypress.env.json, fora do Git).
 * - Rode SEMPRE contra o lab com banco de teste, nunca contra dados reais.
 */
export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:8080",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    viewportWidth: 1280,
    viewportHeight: 860,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    // Retries só em CI (local, uma falha é uma falha).
    retries: { runMode: process.env.CI ? 2 : 0, openMode: 0 },
    video: true,
    screenshotOnRunFailure: true,
    screenshotsFolder: "cypress/reports/screenshots",
    videosFolder: "cypress/reports/videos",
    reporter: "mochawesome",
    reporterOptions: {
      reportDir: "cypress/reports/json",
      overwrite: false,
      html: false,
      json: true,
      timestamp: "isoDateTime",
    },
    setupNodeEvents(on) {
      // Vídeo só fica guardado quando a spec teve falha.
      on("after:spec", (_spec, resultados) => {
        if (
          resultados?.video &&
          resultados.stats.failures === 0 &&
          fs.existsSync(resultados.video)
        ) {
          fs.unlinkSync(resultados.video);
        }
      });
      on("task", {
        log(mensagem: string) {
          console.log(mensagem);
          return null;
        },
      });
    },
  },
});
