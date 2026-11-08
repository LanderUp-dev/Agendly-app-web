/**
 * Regra de tempo de carregamento:
 * < 300 ms nada; até 2 s skeleton; 2–10 s mensagem de contexto; > 10 s aviso de lentidão;
 * erro (500/timeout) com estado na tela e "Tentar novamente".
 */
describe("Carregamento", () => {
  beforeEach(() => cy.login());

  it("resposta rápida (< 300 ms) não pisca skeleton", () => {
    cy.intercept("GET", "/api/v1/lojas", (req) => {
      req.reply({ delay: 50, body: [{ id: 1, nome: "Rápida", cnpj: "11222333000181" }] });
    }).as("lojas");
    cy.visit("/listagem-lojas", {
      onBeforeLoad(win) {
        // Conta quantas vezes um skeleton entrou no DOM.
        (win as unknown as { skeletons: number }).skeletons = 0;
        new win.MutationObserver((mutacoes) => {
          mutacoes.forEach((m) =>
            m.addedNodes.forEach((n) => {
              if (
                n instanceof win.HTMLElement &&
                (n.matches(".skeleton") || n.querySelector(".skeleton"))
              ) {
                (win as unknown as { skeletons: number }).skeletons++;
              }
            }),
          );
        }).observe(win.document, { childList: true, subtree: true });
      },
    });
    cy.wait("@lojas");
    cy.get("[data-cy=tabela]").should("contain", "Rápida");
    cy.window().its("skeletons").should("eq", 0);
  });

  it("1 s: mostra skeleton (sem mensagem) e depois a tabela", () => {
    cy.intercept("GET", "/api/v1/lojas", { delay: 1000, body: [{ id: 1, nome: "Com atraso" }] }).as(
      "lojas",
    );
    cy.visit("/listagem-lojas");
    cy.get("[data-cy=carregando][data-fase=indicador] .skeleton").should("exist");
    cy.get("[data-cy=carregando-mensagem]").should("not.exist");
    cy.wait("@lojas");
    cy.get("[data-cy=tabela]").should("contain", "Com atraso");
  });

  it('4 s: mostra mensagem de contexto ("Carregando lojas...")', () => {
    cy.intercept("GET", "/api/v1/lojas", { delay: 4000, body: [] }).as("lojas");
    cy.visit("/listagem-lojas");
    cy.get("[data-cy=carregando-mensagem]", { timeout: 3500 }).should(
      "have.text",
      "Carregando lojas...",
    );
    cy.get("[data-cy=carregando]").should("have.attr", "aria-live", "polite");
    cy.wait("@lojas");
    cy.get("[data-cy=estado-vazio]").should("exist");
  });

  it('agenda: skeleton da grade e mensagem "Carregando agenda..."', () => {
    cy.intercept("GET", "/api/v1/agendamentos", { delay: 4000, body: [] }).as("agendamentos");
    cy.visit("/agenda");
    cy.get(".agenda-grade--skeleton").should("exist");
    cy.get("[data-cy=carregando-mensagem]", { timeout: 3500 }).should(
      "have.text",
      "Carregando agenda...",
    );
    cy.wait("@agendamentos");
  });

  it('erro 500: estado de erro na tela com "Tentar novamente" que recarrega', () => {
    // Falha até o usuário pedir de novo (o React em dev pode chamar o efeito duas vezes).
    let falhar = true;
    cy.intercept("GET", "/api/v1/lojas", (req) => {
      if (falhar) req.reply({ statusCode: 500, body: "erro" });
      else req.reply({ body: [{ id: 9, nome: "Recuperada" }] });
    }).as("lojas");
    cy.visit("/listagem-lojas");
    cy.get("[data-cy=estado-erro]").should("contain", "O servidor encontrou um erro");
    cy.then(() => {
      falhar = false;
    });
    cy.get("[data-cy=tentar-novamente]").click();
    cy.get("[data-cy=tabela]").should("contain", "Recuperada");
  });

  it("timeout do axios (15 s): estado de erro específico", () => {
    cy.intercept("GET", "/api/v1/lojas", { delay: 16000, body: [] }).as("lojas");
    cy.visit("/listagem-lojas");
    cy.get("[data-cy=carregando-lento]", { timeout: 12000 }).should(
      "contain",
      "Está demorando mais que o normal",
    );
    cy.get("[data-cy=estado-erro]", { timeout: 8000 }).should("contain", "mais de 15 segundos");
  });

  it('select dependente: desabilitado com "Carregando áreas..." e depois habilitado', () => {
    cy.intercept("GET", "/api/v1/AreasAtuacoes", {
      delay: 1000,
      body: [{ id: 3, nome: "Área Select" }],
    }).as("areas");
    cy.visit("/cadastro-servico");
    cy.get("[data-cy=form-area]").should("be.disabled").and("have.attr", "aria-busy", "true");
    cy.get("[data-cy=form-area] option").first().should("have.text", "Carregando áreas...");
    cy.wait("@areas");
    cy.get("[data-cy=form-area]")
      .should("be.enabled")
      .find("option")
      .should("contain", "Área Select");
  });

  it("select dependente vazio mostra mensagem clara", () => {
    cy.intercept("GET", "/api/v1/AreasAtuacoes", { body: [] }).as("areas");
    cy.visit("/cadastro-servico");
    cy.wait("@areas");
    cy.get("#campo-idArea-ajuda")
      .should("contain", "Nenhuma área cadastrada.")
      .find("a")
      .should("have.attr", "href")
      // O link leva o caminho de volta para o formulário de origem.
      .and("eq", "/cadastro-area-atuacao?voltar=%2Fcadastro-servico&campo=idArea");
  });

  it('envio: botão desabilitado, "Salvando..." e aria-busy (sem duplo clique)', () => {
    cy.intercept("GET", "/api/v1/AreasAtuacoes").as("areas");
    let posts = 0;
    cy.intercept("POST", "/api/v1/AreasAtuacoes", (req) => {
      posts++;
      req.reply({ delay: 1500, statusCode: 201, body: { id: 1, nome: "x" } });
    }).as("criar");
    cy.visit("/cadastro-area-atuacao");
    cy.get("[data-cy=form-nome]").type("Área lenta");
    cy.get("[data-cy=form-salvar]").click();
    cy.get("[data-cy=form-salvar]")
      .should("be.disabled")
      .and("have.attr", "aria-busy", "true")
      .and("contain", "Salvando...");
    cy.get("[data-cy=form-salvar]").click({ force: true });
    cy.wait("@criar").then(() => expect(posts).to.eq(1));
  });
});
