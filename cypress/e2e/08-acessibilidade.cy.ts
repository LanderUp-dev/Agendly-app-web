// @requisito RU-03
/**
 * Acessibilidade com axe-core: nenhuma violação séria ou crítica (WCAG 2.1 A/AA).
 * Temas claro e escuro.
 */
const OPCOES = {
  runOnly: { type: "tag" as const, values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
  includedImpacts: ["serious", "critical"],
};

function registrarViolacoes(
  violacoes: { id: string; impact?: string | null; help: string; nodes: unknown[] }[],
) {
  cy.task(
    "log",
    violacoes
      .map((v) => `[a11y] ${v.impact} ${v.id}: ${v.help} (${v.nodes.length} elemento(s))`)
      .join("\n") || "[a11y] sem violações",
  );
}

const TELAS_PUBLICAS = ["/home", "/login", "/register"];
const TELAS_LOGADAS = [
  "/agenda",
  "/listagem-lojas",
  "/listagem-clientes",
  "/cadastro-loja",
  "/cadastro-servico",
];

["light", "dark"].forEach((tema) => {
  describe(`Acessibilidade (tema ${tema === "light" ? "claro" : "escuro"})`, () => {
    TELAS_PUBLICAS.forEach((rota) => {
      it(`${rota} sem violações sérias/críticas`, () => {
        cy.clearAllLocalStorage();
        cy.visit(rota, { onBeforeLoad: (w) => w.localStorage.setItem("web_app_tema", tema) });
        cy.get("h1").should("be.visible");
        cy.injectAxe();
        cy.checkA11y(undefined, OPCOES, registrarViolacoes);
      });
    });

    TELAS_LOGADAS.forEach((rota) => {
      it(`${rota} sem violações sérias/críticas`, () => {
        cy.login();
        cy.visit(rota, { onBeforeLoad: (w) => w.localStorage.setItem("web_app_tema", tema) });
        cy.get("h1").should("be.visible");
        cy.get("[data-cy=carregando]").should("not.exist");
        cy.injectAxe();
        cy.checkA11y(undefined, OPCOES, registrarViolacoes);
      });
    });
  });
});
