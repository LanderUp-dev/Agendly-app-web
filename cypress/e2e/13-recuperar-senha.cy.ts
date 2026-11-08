// @requisito RO-40 RS-11
/**
 * "Esqueci a senha" de ponta a ponta. O código chega na caixa falsa do lab (Mailpit,
 * http://localhost:8025, ver Agendly-api/docker-compose.yml) e é lido pela API dela.
 * Usa um usuário próprio (criado aqui), para não trocar a senha da conta de teste principal.
 * Variável: CYPRESS_MAILPIT_URL (padrão http://localhost:8025).
 */
import { gerarCPF, gerarCelular, nascimento, sufixo } from "../support/dados";

const MAILPIT = (Cypress.env("MAILPIT_URL") as string) || "http://localhost:8025";
const SENHA_ANTIGA = "SenhaAntiga1";
const SENHA_NOVA = "SenhaNova2026";

/** Último código de 6 dígitos enviado para o e-mail (espera até chegar). */
function codigoDoEmail(email: string, tentativas = 20): Cypress.Chainable<string> {
  return cy
    .request(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}&limit=1`)
    .then((r) => {
      const msg = r.body.messages?.[0];
      if (!msg) {
        if (tentativas <= 0) throw new Error(`Nenhum e-mail para ${email} no Mailpit`);
        cy.wait(500);
        return codigoDoEmail(email, tentativas - 1);
      }
      return cy.request(`${MAILPIT}/api/v1/message/${msg.ID}`).then((m) => {
        const codigo = /(\d{6})/.exec(m.body.Text as string)?.[1];
        expect(codigo, "código no e-mail").to.match(/^\d{6}$/);
        return codigo as string;
      });
    });
}

describe("Recuperar senha", () => {
  let email: string;

  before(() => {
    email = `recupera.${sufixo()}@e2e.test`.toLowerCase();
    cy.request({
      method: "POST",
      url: "/api/v1/usuarios",
      body: {
        nome: "Recupera",
        sobrenome: "E2E",
        email,
        celular: gerarCelular(),
        cpf: gerarCPF(),
        dtaNascimento: nascimento(30),
        senha: SENHA_ANTIGA,
      },
    })
      .its("status")
      .should("eq", 201);
  });

  it("o login tem o link e a tela pede o e-mail", () => {
    cy.visit("/login");
    cy.get("[data-cy=link-esqueci-senha]").click();
    cy.location("pathname").should("eq", "/recuperar-senha");
    cy.get("[data-cy=recuperar-email]").should("be.focused");
    cy.get("[data-cy=link-voltar-login]").should("have.attr", "href", "/login");
  });

  it("e-mail sem conta recebe a mesma resposta (não revela quem tem conta)", () => {
    cy.visit("/recuperar-senha");
    cy.get("[data-cy=recuperar-form-email]").should("have.attr", "data-hidratado", "true");
    cy.intercept("POST", "/api/v1/auth/user/resetPassword").as("pedir");
    cy.get("[data-cy=recuperar-email]").type(`ninguem.${sufixo()}@e2e.test`);
    cy.get("[data-cy=recuperar-enviar]").click();
    cy.wait("@pedir").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=recuperar-instrucao]").should("contain", "tiver uma conta");
    cy.get("[data-cy=recuperar-codigo]").should("be.visible");
  });

  it("código errado e senha fraca mostram o erro; o código certo troca a senha", () => {
    cy.visit("/recuperar-senha");
    cy.get("[data-cy=recuperar-form-email]").should("have.attr", "data-hidratado", "true");
    cy.get("[data-cy=recuperar-email]").type(email);
    cy.get("[data-cy=recuperar-enviar]").click();
    cy.get("[data-cy=recuperar-codigo]").should("be.visible");

    codigoDoEmail(email).then((codigo) => {
      const errado = codigo === "111111" ? "222222" : "111111";

      // Senha fraca: barrada no próprio formulário
      cy.get("[data-cy=recuperar-codigo]").type(codigo);
      cy.get("[data-cy=recuperar-senha]").type("fraca");
      cy.get("[data-cy=recuperar-confirmar]").type("fraca");
      cy.get("[data-cy=recuperar-salvar]").click();
      cy.get("[data-cy=recuperar-erro]").should("contain", "8 caracteres");

      // Código errado: mensagem da API
      cy.get("[data-cy=recuperar-codigo]").clear().type(errado);
      cy.get("[data-cy=recuperar-senha]").clear().type(SENHA_NOVA);
      cy.get("[data-cy=recuperar-confirmar]").clear().type(SENHA_NOVA);
      cy.get("[data-cy=recuperar-salvar]").click();
      cy.get("[data-cy=recuperar-erro]").should("contain", "Código inválido");

      // Código certo
      cy.get("[data-cy=recuperar-codigo]").clear().type(codigo);
      cy.get("[data-cy=recuperar-salvar]").click();
      cy.location("pathname").should("eq", "/login");
    });

    // A senha nova funciona e a antiga não
    cy.request({
      method: "POST",
      url: "/api/v1/auth/login",
      body: { email, senha: SENHA_ANTIGA },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 401);
    cy.request("POST", "/api/v1/auth/login", { email, senha: SENHA_NOVA })
      .its("status")
      .should("eq", 200);
  });
});
