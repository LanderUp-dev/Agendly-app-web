/**
 * Sininho de avisos e página /notificacoes.
 *
 * Gerar um aviso de verdade exige DOIS usuários na mesma loja (quem age não é avisado) ou o
 * job das 08:00 do caixa: isso está coberto no backend (NotificacaoTest). Aqui as respostas
 * da API são simuladas com cy.intercept para testar a interface de forma determinística;
 * só "marcar todas" e a contagem vazia usam a API real.
 */

const pagina = (itens: unknown[], temMais = false) => ({
  itens,
  pagina: 0,
  tamanho: itens.length,
  total: itens.length,
  totalPaginas: 1,
  temMais,
});

const aviso = (id: number, lida: boolean, titulo = "Novo agendamento") => ({
  id,
  tipo: "AGENDAMENTO_CRIADO",
  titulo,
  mensagem: "Maria Souza com Ana em 10/11/2026 às 14:30.",
  link: "/agenda?data=2026-11-10",
  criadaEm: new Date().toISOString(),
  lidaEm: lida ? new Date().toISOString() : null,
  lida,
});

describe("Notificações: sininho e página de avisos", () => {
  beforeEach(() => {
    cy.login();
  });

  it("API real: contagem responde e 'marcar todas' zera", () => {
    cy.visit("/agenda");
    cy.api("POST", "/notificacoes/lidas").its("status").should("eq", 200);
    cy.api<{ naoLidas: number }>("GET", "/notificacoes/nao-lidas/contagem")
      .its("body.naoLidas")
      .should("eq", 0);
  });

  it("o sino aparece sem número quando não há avisos e abre o painel vazio", () => {
    cy.intercept("GET", "/api/v1/notificacoes/nao-lidas/contagem", { naoLidas: 0 }).as("contagem");
    cy.intercept("GET", "/api/v1/notificacoes?*", pagina([])).as("lista");
    cy.visit("/agenda");
    cy.wait("@contagem");

    cy.get("[data-cy=sino]")
      .should("be.visible")
      .and("have.attr", "aria-label", "Avisos: nenhum aviso novo")
      .and("have.attr", "aria-expanded", "false");
    cy.get("[data-cy=sino-contagem]").should("not.exist");

    cy.get("[data-cy=sino]").click();
    cy.wait("@lista");
    cy.get("[data-cy=sino-painel]").should("be.visible").and("contain", "Nenhum aviso por aqui.");
    cy.get("[data-cy=sino]").should("have.attr", "aria-expanded", "true");
    cy.get("[data-cy=sino-marcar-todas]").should("not.exist");

    // Esc fecha e o foco volta ao botão.
    cy.get("body").type("{esc}");
    cy.get("[data-cy=sino-painel]").should("not.exist");
    cy.focused().should("have.attr", "data-cy", "sino");

    // Clique fora também fecha.
    cy.get("[data-cy=sino]").click();
    cy.get("[data-cy=sino-painel]").should("be.visible");
    cy.get("main").click("topLeft", { force: true });
    cy.get("[data-cy=sino-painel]").should("not.exist");
  });

  it("mostra 9+, destaca não lidos e marca todas como lidas", () => {
    cy.intercept("GET", "/api/v1/notificacoes/nao-lidas/contagem", { naoLidas: 12 }).as("contagem");
    cy.intercept(
      "GET",
      "/api/v1/notificacoes?*",
      pagina([aviso(2, false), aviso(1, true, "Lido")]),
    ).as("lista");
    cy.intercept("POST", "/api/v1/notificacoes/lidas", { atualizadas: 12 }).as("todas");
    cy.visit("/agenda");
    cy.wait("@contagem");

    cy.get("[data-cy=sino-contagem]").should("have.text", "9+");
    cy.get("[data-cy=sino]").should("have.attr", "aria-label", "Avisos: 12 avisos não lidos");

    cy.get("[data-cy=sino]").click();
    cy.wait("@lista");
    cy.get("[data-cy=sino-item]").should("have.length", 2);
    cy.get("[data-cy=sino-item]").first().should("have.class", "sino__item--nao-lido");
    cy.get("[data-cy=sino-item]").last().should("not.have.class", "sino__item--nao-lido");

    cy.get("[data-cy=sino-marcar-todas]").click();
    cy.wait("@todas");
    cy.get("[data-cy=sino-contagem]").should("not.exist");
    cy.get(".sino__item--nao-lido").should("not.exist");
  });

  it("clicar no aviso marca como lido e abre o link", () => {
    cy.intercept("GET", "/api/v1/notificacoes/nao-lidas/contagem", { naoLidas: 1 }).as("contagem");
    cy.intercept("GET", "/api/v1/notificacoes?*", pagina([aviso(7, false)])).as("lista");
    cy.intercept("POST", "/api/v1/notificacoes/7/lida", aviso(7, true)).as("lida");
    cy.visit("/listagem-clientes");
    cy.wait("@contagem");

    cy.get("[data-cy=sino]").click();
    cy.wait("@lista");
    cy.get("[data-cy=sino-item]").first().click();
    cy.wait("@lida");
    cy.location("pathname").should("eq", "/agenda");
    cy.location("search").should("contain", "data=2026-11-10");
  });

  it("erro ao carregar não quebra a barra", () => {
    cy.intercept("GET", "/api/v1/notificacoes/nao-lidas/contagem", { statusCode: 500, body: "" });
    cy.intercept("GET", "/api/v1/notificacoes?*", { statusCode: 500, body: "" }).as("lista");
    cy.visit("/agenda");
    cy.get("[data-cy=sino]").should("be.visible").click();
    cy.wait("@lista");
    cy.get("[data-cy=sino-painel]").should("contain", "Não foi possível carregar os avisos.");
    cy.get("[data-cy=navbar]").should("be.visible");
  });

  it("'Ver todas' abre a página com filtro e Carregar mais", () => {
    cy.intercept("GET", "/api/v1/notificacoes/nao-lidas/contagem", { naoLidas: 1 });
    cy.intercept("GET", "/api/v1/notificacoes?*", (req) => {
      const naoLidas = req.query.naoLidas === "true";
      const p = Number(req.query.pagina ?? 0);
      if (naoLidas) req.reply(pagina([]));
      else if (p === 0) req.reply(pagina([aviso(3, false), aviso(2, true)], true));
      else req.reply({ ...pagina([aviso(1, true, "Mais antigo")]), pagina: 1 });
    }).as("lista");
    cy.visit("/agenda");
    cy.get("[data-cy=sino]").click();
    cy.get("[data-cy=sino-ver-todas]").click();
    cy.location("pathname").should("eq", "/notificacoes");

    cy.get("[data-cy=notificacao-item]").should("have.length", 2);
    cy.get("[data-cy=notificacoes-carregar-mais]").click();
    cy.get("[data-cy=notificacao-item]")
      .should("have.length", 3)
      .last()
      .should("contain", "Mais antigo");
    cy.get("[data-cy=notificacoes-carregar-mais]").should("not.exist");

    cy.get("[data-cy=notificacoes-filtro-nao-lidas]").click();
    cy.get("[data-cy=notificacoes-filtro-nao-lidas]").should("have.attr", "aria-pressed", "true");
    cy.get("[data-cy=estado-vazio]").should("contain", "Nenhum aviso por aqui.");
  });

  it("no celular o painel ocupa a largura da tela", () => {
    cy.viewport(375, 740);
    cy.intercept("GET", "/api/v1/notificacoes/nao-lidas/contagem", { naoLidas: 0 });
    cy.intercept("GET", "/api/v1/notificacoes?*", pagina([]));
    cy.visit("/agenda");
    cy.get("[data-cy=sino]").click();
    cy.get("[data-cy=sino-painel]").then(($p) => {
      const r = $p[0].getBoundingClientRect();
      expect(r.width).to.be.greaterThan(340);
    });
  });
});
