// @requisito RO-35 RS-07
import { gerarCPF, gerarCelular, nascimento, sufixo } from "../support/dados";

/**
 * Cortesia: o administrador da plataforma (ADMIN_EMAILS) libera acesso grátis a uma loja.
 * No lab, a conta padrão do E2E (CYPRESS_USER_EMAIL) é a admin.
 * O bloqueio de lojas sem acesso fica desligado no lab (ACESSO_BLOQUEAR=false);
 * ele é testado no backend (CortesiaAdminTest).
 */
const API = "/api/v1";

describe("Cortesia (acesso grátis liberado pelo admin)", () => {
  let lojaId: number;
  let emailLoja: string;

  before(() => {
    cy.login();
    cy.visit("/agenda");
    cy.lojaAtiva().then((loja) => {
      lojaId = loja.id;
      cy.api<{ email: string }>("GET", `/lojas/${loja.id}`).then(({ body }) => {
        emailLoja = body.email;
      });
    });
  });

  const abrirMinhaLojaNoAdmin = () => {
    cy.visit("/admin");
    cy.get("input[type=search], input[placeholder^='Buscar']").first().type(emailLoja);
    cy.get(`[data-cy=acesso-loja-${lojaId}]`).should("exist");
  };

  it("admin vê o menu de administração", () => {
    cy.login();
    cy.visit("/agenda");
    cy.get("[data-cy=menu-navegacao]").click();
    cy.get("[data-cy=menu-admin]").should("contain", "Administração").click();
    cy.location("pathname").should("eq", "/admin");
    cy.contains("h1", "Administração").should("exist");
  });

  it("libera cortesia com prazo e a loja vê na tela do plano", () => {
    cy.login();
    abrirMinhaLojaNoAdmin();
    cy.get(`[data-cy=liberar-cortesia-${lojaId}]`).click();
    cy.get("[data-cy=modal-cortesia]").should("be.visible");
    cy.get("[data-cy=cortesia-motivo]").clear();
    cy.get("[data-cy=salvar-cortesia]").click();
    cy.contains("Informe o motivo").should("exist"); // motivo obrigatório

    const fim = new Date();
    fim.setDate(fim.getDate() + 30);
    const iso = fim.toLocaleDateString("sv-SE");
    const br = fim.toLocaleDateString("pt-BR");
    cy.get("[data-cy=cortesia-motivo]").type("Parceiro E2E");
    cy.get("[data-cy=cortesia-sem-prazo]").uncheck();
    cy.get("[data-cy=cortesia-ate]").type(iso);
    cy.intercept("PUT", `${API}/admin/lojas/*/cortesia`).as("cortesia");
    cy.get("[data-cy=salvar-cortesia]").click();
    cy.wait("@cortesia").its("response.statusCode").should("eq", 200);
    cy.get(`[data-cy=acesso-loja-${lojaId}]`)
      .should("contain", "Cortesia")
      .and("contain", br)
      .and("contain", "Parceiro E2E");

    cy.visit("/plano");
    cy.get("[data-cy=situacao-acesso]")
      .should("contain", "Cortesia")
      .and("contain", "Não há nada a pagar");
    cy.contains("h2", "Planos").should("not.exist");
  });

  it("revoga a cortesia", () => {
    cy.login();
    abrirMinhaLojaNoAdmin();
    cy.on("window:confirm", () => true);
    cy.get(`[data-cy=revogar-cortesia-${lojaId}]`).click();
    cy.get(`[data-cy=acesso-loja-${lojaId}]`).should("contain", "revogada");
    cy.get(`[data-cy=liberar-cortesia-${lojaId}]`).should("contain", "Liberar cortesia");
  });

  it("quem não é admin não acessa a administração", () => {
    const pessoa = { email: `naoadmin.${sufixo()}@e2e.test`, senha: `Nao${Date.now()}x` };
    cy.request("POST", `${API}/usuarios`, {
      nome: "Nao",
      sobrenome: "Admin",
      email: pessoa.email,
      celular: gerarCelular(),
      cpf: gerarCPF(),
      dtaNascimento: nascimento(30),
      senha: pessoa.senha,
    });
    cy.request("POST", `${API}/auth/login`, pessoa).then(({ body }) => {
      const headers = { Authorization: `Bearer ${body.token}` };
      cy.request({ url: `${API}/admin/eu`, headers })
        .its("body.admin")
        .should("eq", false);
      cy.request({ url: `${API}/admin/lojas`, headers, failOnStatusCode: false }).then((r) => {
        expect(r.status).to.eq(403);
        expect(r.body).to.contain("administração da plataforma");
      });
      cy.request({
        method: "PUT",
        url: `${API}/admin/lojas/${lojaId}/cortesia`,
        headers,
        body: { motivo: "eu mesmo" },
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 403);

      // Pela tela: /admin manda de volta
      cy.visit("/login", {
        onBeforeLoad(w) {
          w.localStorage.setItem("token", body.token);
          w.localStorage.setItem(
            "usuario",
            JSON.stringify({ id: body.id, nome: body.nome, email: body.email }),
          );
        },
      });
      cy.visit("/admin");
      cy.location("pathname").should("eq", "/listagem-lojas");
    });
  });
});
