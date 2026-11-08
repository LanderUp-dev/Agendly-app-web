// @requisito RE-03 RE-04 RE-05 RE-11 RE-12
const LISTAGENS = [
  {
    rota: "/listagem-lojas",
    api: "/api/v1/lojas",
    titulo: "Lojas",
    vazio: "Nenhuma loja cadastrada",
  },
  {
    rota: "/listagem-clientes",
    api: "/api/v1/clientes",
    titulo: "Clientes",
    vazio: "Nenhum cliente cadastrado",
  },
  {
    rota: "/listagem-funcionarios",
    api: "/api/v1/funcionarios",
    titulo: "Funcionários",
    vazio: "Nenhum funcionário cadastrado",
  },
  {
    rota: "/listagem-servicos",
    api: "/api/v1/servicos",
    titulo: "Serviços",
    vazio: "Nenhum serviço cadastrado",
  },
  {
    rota: "/listagem-cobrancistas",
    api: "/api/v1/cobrancistas",
    titulo: "Cobrancistas",
    vazio: "Nenhum cobrancista cadastrado",
  },
  {
    rota: "/listagem-areas-atuacao",
    api: "/api/v1/AreasAtuacoes",
    titulo: "Áreas de atuação",
    vazio: "Nenhuma área cadastrada",
  },
  {
    rota: "/listagem-equipes",
    api: "/api/v1/equipes",
    titulo: "Equipes",
    vazio: "Ninguém na equipe ainda",
  },
];

describe("Listagens", () => {
  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    cy.criarLoja("Loja Listagem Alfa");
  });

  beforeEach(() => cy.login());

  LISTAGENS.forEach(({ rota, api, titulo, vazio }) => {
    describe(titulo, () => {
      it("carrega com dados reais da API", () => {
        cy.intercept("GET", api).as("listar");
        cy.visit(rota);
        cy.get("h1").should("have.text", titulo);
        cy.wait("@listar").its("response.statusCode").should("eq", 200);
        cy.get("[data-cy=tabela], [data-cy=estado-vazio]").should("exist");
        cy.get("[data-cy=estado-erro]").should("not.exist");
      });

      it("mostra estado vazio quando não há registros", () => {
        cy.intercept("GET", api, { statusCode: 200, body: [] }).as("listar");
        cy.visit(rota);
        cy.wait("@listar");
        cy.get("[data-cy=estado-vazio]").should("contain", vazio);
        cy.get("[data-cy=estado-vazio] a").should("exist"); // ação de cadastrar
      });
    });
  });

  it("pesquisa filtra a tabela e informa quando nada é encontrado", () => {
    cy.intercept("GET", "/api/v1/lojas").as("listar");
    cy.visit("/listagem-lojas");
    cy.wait("@listar");
    cy.get("[data-cy=busca]").type("Loja Listagem Alfa");
    cy.get("[data-cy=tabela] tbody tr")
      .should("have.length.at.least", 1)
      .first()
      .should("contain", "Loja Listagem Alfa");
    cy.get("[data-cy=contagem]").should("contain", "de");
    cy.get("[data-cy=busca]").clear().type("zzz-nada-encontrado-zzz");
    cy.get("[data-cy=estado-vazio]").should("contain", "Nada encontrado");
  });

  it("Especialidades (Área x Funcionário) é montada a partir de /funcionarios", () => {
    cy.intercept("GET", "/api/v1/funcionarios", {
      body: [{ id: 7, nome: "Bia", sobrenome: "Rocha", area: [{ id: 3, nome: "Estética" }] }],
    }).as("func");
    cy.visit("/listagem-areas-funcionario");
    cy.wait("@func");
    cy.get("[data-cy=tabela]").should("contain", "Bia Rocha").and("contain", "Estética");
  });
});
