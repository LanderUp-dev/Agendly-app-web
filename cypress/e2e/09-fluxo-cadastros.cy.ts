// @requisito RE-02 RE-03 RE-04 RE-05
/**
 * Ordem dos cadastros e navegação (docs/checklist-fluxo-cadastros.md).
 * As listas são simuladas com cy.intercept: nada é gravado no banco.
 */
const loja = { id: 7, nome: "Loja E2E", cnpj: "11222333000181" };

describe("Fluxo de cadastros", () => {
  beforeEach(() => cy.login());

  it("menu segue a ordem de dependência", () => {
    cy.intercept("GET", "/api/v1/**", { body: [] });
    cy.visit("/listagem-lojas");
    cy.get(".app-navbar__nav a").then(($a) => {
      expect([...$a].map((a) => a.textContent?.trim())).to.deep.eq([
        "Agenda",
        "Caixa",
        "Painel",
        "Lojas",
        "Áreas",
        "Funcionários",
        "Serviços",
        "Clientes",
      ]);
    });
  });

  it("o campo Loja mostra a loja ativa, só leitura, com atalho para trocar", () => {
    cy.lojaAtiva().then((ativa) => {
      cy.visit("/cadastro-funcionario");
      cy.get("[data-cy=form-loja-ativa]")
        .should("have.value", ativa.nome)
        .and("have.attr", "readonly");
      cy.get("#campo-loja-ativa-ajuda a").should("have.attr", "href", "/selecionar-loja");
    });
  });

  it('"Cadastrar agora" leva junto o caminho de volta', () => {
    cy.intercept("GET", "/api/v1/lojas", { body: [loja] });
    cy.intercept("GET", "/api/v1/AreasAtuacoes", { body: [] });
    cy.visit("/cadastro-servico");
    cy.contains("a", "Cadastrar agora")
      .should("have.attr", "href")
      .and("include", "/cadastro-area-atuacao?voltar=%2Fcadastro-servico&campo=idArea");
  });

  it("na volta, o item recém-criado vem selecionado", () => {
    cy.intercept("GET", "/api/v1/lojas", { body: [loja, { ...loja, id: 8, nome: "Outra" }] });
    cy.intercept("GET", "/api/v1/AreasAtuacoes", {
      body: [
        { id: 3, nome: "Cabelo" },
        { id: 4, nome: "Barba" },
      ],
    });
    cy.visit("/cadastro-servico?campo=idArea&novo=4");
    cy.get("select[name=idArea]").should("have.value", "4");
  });

  it('agenda mostra "Primeiros passos" com o próximo passo', () => {
    cy.intercept("GET", "/api/v1/lojas", { body: [loja] });
    cy.intercept("GET", "/api/v1/AreasAtuacoes", { body: [] });
    cy.intercept("GET", "/api/v1/funcionarios", { body: [] });
    cy.intercept("GET", "/api/v1/servicos", { body: [] });
    cy.intercept("GET", "/api/v1/clientes", { body: [] });
    cy.intercept("GET", "/api/v1/agendamentos", { body: [] });
    cy.visit("/agenda");
    cy.get("[data-cy=primeiros-passos]").should("contain", "1 de 5 feitos");
    cy.get("[data-cy=passo-area]").should("have.attr", "href", "/cadastro-area-atuacao");
  });

  it("listagem com mais de 20 itens é paginada", () => {
    const areas = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      nome: `Área ${i + 1}`,
      descricao: "",
    }));
    cy.intercept("GET", "/api/v1/AreasAtuacoes", { body: areas });
    cy.intercept("GET", "/api/v1/lojas", { body: [loja] });
    cy.visit("/listagem-areas-atuacao");
    cy.get("[data-cy=tabela] tbody tr").should("have.length", 20);
    cy.get("[data-cy=paginacao]").should("contain", "1–20 de 25");
    cy.get("[data-cy=pagina-proxima]").click();
    cy.get("[data-cy=tabela] tbody tr").should("have.length", 5);
    cy.get("[data-cy=pagina-proxima]").should("be.disabled");
  });
});
