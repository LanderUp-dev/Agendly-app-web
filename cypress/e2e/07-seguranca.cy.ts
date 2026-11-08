// @requisito RS-03 RS-01
import { credenciais } from "../support/commands";

/** JWT com formato e validade certos, mas assinatura falsa. */
const tokenForjado = (extra: Record<string, unknown> = {}) => {
  const b64 = (o: object) =>
    btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payload = { sub: "forjado@e2e.test", exp: Math.floor(Date.now() / 1000) + 3600, ...extra };
  return `${b64({ alg: "HS256" })}.${b64(payload)}.assinaturaInvalida`;
};

describe("Segurança", () => {
  before(() => cy.garantirUsuario());

  it("envia Authorization: Bearer nas chamadas protegidas", () => {
    cy.login();
    cy.intercept("GET", "/api/v1/**").as("protegida");
    cy.visit("/listagem-clientes");
    cy.wait("@protegida").then(({ request }) => {
      expect(request.headers.authorization).to.match(/^Bearer [\w-]+\.[\w-]+\.[\w-]*$/);
    });
  });

  it("NÃO envia Authorization no /auth/login", () => {
    const { email, senha } = credenciais();
    cy.clearAllLocalStorage();
    cy.intercept("POST", "/api/v1/auth/login").as("login");
    cy.visit("/login");
    cy.get("[data-cy=login-form][data-hidratado=true]");
    cy.get("[data-cy=login-email]").type(email);
    cy.get("[data-cy=login-senha]").type(senha, { log: false });
    cy.get("[data-cy=login-entrar]").click();
    cy.wait("@login").then(({ request }) => {
      expect(request.headers).to.not.have.property("authorization");
    });
  });

  it("não usa cookies de sessão (JWT stateless)", () => {
    cy.login();
    cy.visit("/agenda");
    cy.getCookies().should("have.length", 0);
  });

  it("403 sem sessão válida (token com assinatura inválida) leva ao login", () => {
    // Formato de JWT, validade futura e loja no token, mas assinatura falsa: o guard
    // do front aceita, o backend recusa com 403 e o front deve encerrar a sessão.
    const forjado = tokenForjado({ equipeId: "forjada" });
    cy.intercept("GET", "/api/v1/clientes").as("clientes");
    cy.visit("/login", {
      onBeforeLoad(w) {
        w.localStorage.setItem("token", forjado);
        w.localStorage.setItem("usuario", JSON.stringify({ id: 0, nome: "Forjado" }));
      },
    });
    cy.visit("/listagem-clientes");
    cy.wait("@clientes").its("response.statusCode").should("eq", 403);
    cy.location("pathname").should("eq", "/login");
    cy.window().its("localStorage").invoke("getItem", "token").should("be.null");
  });

  it("token inválido sem loja não prende o usuário na escolha da loja", () => {
    // Sem loja no token, o guard leva à escolha da loja; lá a API recusa o token
    // (403 fora das rotas de negócio) e o front deve voltar ao login.
    cy.visit("/login", {
      onBeforeLoad(w) {
        w.localStorage.setItem("token", tokenForjado());
        w.localStorage.setItem("usuario", JSON.stringify({ id: 0, nome: "Forjado" }));
      },
    });
    cy.visit("/listagem-clientes");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
    cy.window().its("localStorage").invoke("getItem", "token").should("be.null");
  });

  it("a API responde 403 sem token (rota protegida)", () => {
    cy.request({ url: "/api/v1/lojas", failOnStatusCode: false }).its("status").should("eq", 403);
  });

  it("POST /usuarios não devolve o hash da senha", () => {
    const email = `hash.${Date.now()}@e2e.test`;
    cy.request({
      method: "POST",
      url: "/api/v1/usuarios",
      body: {
        nome: "Hash",
        sobrenome: "Teste",
        email,
        celular: "32999990000",
        cpf: "52998224725",
        dtaNascimento: "1990-01-01",
        senha: "Senha1234",
      },
      failOnStatusCode: false,
    }).then((r) => {
      expect(r.status).to.eq(201);
      expect(r.body, "resposta do cadastro").to.not.have.property("senha");
    });
  });
});
