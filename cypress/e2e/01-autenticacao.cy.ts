// @requisito RO-34
import { credenciais } from "../support/commands";

/** Faz login pela interface, ajustando as equipes que a API devolve no login. */
function loginPelaTela(ajustarEquipes: (equipes: Array<{ id: string }>) => Array<{ id: string }>) {
  const { email, senha } = credenciais();
  cy.intercept("POST", "/api/v1/auth/login", (req) => {
    req.continue((res) => {
      res.body.equipes = ajustarEquipes(res.body.equipes ?? []);
    });
  }).as("login");
  // O usuário do E2E pode ser admin da plataforma (ADMIN_EMAILS no lab); admin sem loja vai
  // para /admin. Aqui testamos o caminho de quem NÃO é admin.
  cy.intercept("GET", "/api/v1/admin/eu", { body: { admin: false } });
  cy.visit("/login");
  cy.window().then((w) => w.sessionStorage.removeItem("agendly_admin"));
  cy.get("[data-cy=login-form][data-hidratado=true]");
  cy.get("[data-cy=login-email]").type(email);
  cy.get("[data-cy=login-senha]").type(senha, { log: false });
  cy.get("[data-cy=login-entrar]").click();
  cy.wait("@login").its("response.statusCode").should("eq", 200);
}

describe("Autenticação", () => {
  // cy.login garante que o usuário de teste existe e tem ao menos uma loja.
  before(() => cy.login());
  beforeEach(() => cy.clearAllLocalStorage());

  it("login com uma loja entra nela e vai para a agenda", () => {
    cy.intercept("POST", "/api/v1/auth/trocar-contexto").as("contexto");
    loginPelaTela((equipes) => equipes.slice(0, 1));
    cy.wait("@contexto").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/agenda");
    cy.window()
      .its("localStorage")
      .invoke("getItem", "token")
      .should("match", /^[\w-]+\.[\w-]+\./);
    cy.window()
      .its("localStorage")
      .then((ls) => {
        const usuario = JSON.parse(String(ls.getItem("usuario")));
        expect(usuario).to.have.keys(["id", "nome", "email"]);
        const loja = JSON.parse(String(ls.getItem("loja_ativa")));
        expect(loja.lojaId, "loja ativa").to.be.a("number");
      });
    cy.get("[data-cy=loja-ativa]").should("have.attr", "title").and("include", "Loja atual");
  });

  it("login sem loja leva ao cadastro da loja", () => {
    loginPelaTela(() => []);
    cy.location("pathname").should("eq", "/cadastro-loja");
  });

  it("login com várias lojas pede para escolher", () => {
    loginPelaTela((equipes) => [equipes[0], { ...equipes[0], id: "outra-equipe" }]);
    cy.location("pathname").should("eq", "/selecionar-loja");
    cy.get("[data-cy=selecionar-loja]").first().click();
    cy.location("pathname").should("eq", "/agenda");
  });

  it("tela de negócio sem loja escolhida leva à escolha da loja", () => {
    loginPelaTela(() => []);
    cy.location("pathname").should("eq", "/cadastro-loja");
    cy.visit("/listagem-clientes");
    cy.location("pathname").should("eq", "/selecionar-loja");
  });

  it('senha errada mostra "E-mail ou senha incorretos."', () => {
    const { email } = credenciais();
    cy.intercept("POST", "/api/v1/auth/login").as("login");
    cy.visit("/login");
    cy.get("[data-cy=login-form][data-hidratado=true]");
    cy.get("[data-cy=login-email]").type(email);
    cy.get("[data-cy=login-senha]").type("SenhaErrada999");
    cy.get("[data-cy=login-entrar]").click();
    cy.wait("@login").its("response.statusCode").should("eq", 401);
    cy.get("[data-cy=login-erro]").should("have.text", "E-mail ou senha incorretos.");
    cy.location("pathname").should("eq", "/login");
  });

  ["/agenda", "/cadastro-cliente"].forEach((rota) => {
    it(`${rota} sem login redireciona para /login`, () => {
      cy.clearAllLocalStorage();
      cy.visit(rota);
      cy.location("pathname").should("eq", "/login");
    });
  });

  it("token expirado volta ao login", () => {
    const b64 = (o: object) =>
      btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    const expirado = `${b64({ alg: "HS256" })}.${b64({ sub: "x", exp: Math.floor(Date.now() / 1000) - 60 })}.assinatura`;
    cy.visit("/login");
    cy.window().then((w) => w.localStorage.setItem("token", expirado));
    cy.visit("/agenda");
    cy.location("pathname").should("eq", "/login");
    cy.window().its("localStorage").invoke("getItem", "token").should("be.null");
  });

  it("token removido durante o uso volta ao login", () => {
    cy.login();
    cy.visit("/listagem-lojas");
    cy.get("[data-cy=navbar]").should("be.visible");
    cy.window().then((w) => w.localStorage.removeItem("token"));
    // Nova chamada sem token: o backend responde 403 e o front deve ir para o login.
    cy.contains("a", "Clientes").click();
    cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
  });

  it('"Sair" encerra a sessão', () => {
    cy.login();
    cy.visit("/agenda");
    cy.get("[data-cy=sair]").click();
    cy.location("pathname").should("eq", "/login");
    cy.window().its("localStorage").invoke("getItem", "token").should("be.null");
  });
});
