/// <reference types="cypress" />
import { gerarCPF, gerarCelular, gerarCNPJ, nascimento, sufixo } from "./dados";

const API = "/api/v1";

export interface Credenciais {
  email: string;
  senha: string;
}

/** Credenciais só por variável de ambiente (CYPRESS_USER_EMAIL / CYPRESS_USER_PASSWORD). */
export function credenciais(): Credenciais {
  const email = Cypress.env("USER_EMAIL");
  const senha = Cypress.env("USER_PASSWORD");
  if (!email || !senha) {
    throw new Error(
      "Defina CYPRESS_USER_EMAIL e CYPRESS_USER_PASSWORD (ou cypress.env.json). Veja cypress.env.example.json.",
    );
  }
  return { email, senha };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Garante que o usuário de teste existe (cria pela API pública se preciso). */
      garantirUsuario(): Chainable<void>;
      /**
       * Login pela API com cy.session, como o app faz: garante que o usuário de
       * teste tem uma loja, entra nela (POST /auth/trocar-contexto) e guarda
       * token de contexto, usuario e loja_ativa no localStorage.
       */
      login(): Chainable<void>;
      /** Token JWT da sessão atual (após cy.login). */
      token(): Chainable<string>;
      /** Chamada autenticada à API (Bearer). */
      api<T = unknown>(
        metodo: string,
        caminho: string,
        corpo?: unknown,
        falhar?: boolean,
      ): Chainable<Cypress.Response<T>>;
      criarLoja(nome?: string): Chainable<{ id: number; nome: string }>;
      criarArea(idLoja: number, nome?: string): Chainable<{ id: number; nome: string }>;
      criarFuncionario(idLoja: number, nome?: string): Chainable<{ id: number; nome: string }>;
      criarCliente(idLoja: number, nome?: string): Chainable<{ id: number; nome: string }>;
      criarServico(
        idLoja: number,
        idArea: number,
        nome?: string,
      ): Chainable<{ id: number; nome: string }>;
      /** Loja ativa da sessão (a do token): é nela que a API grava tudo. */
      lojaAtiva(): Chainable<{ id: number; nome: string }>;
      /** Loja onde os dados de teste são criados: a loja ativa da sessão. */
      lojaDeTeste(): Chainable<{ id: number; nome: string }>;
    }
  }
}

export const dadosLoja = (nome: string) => ({
  nome,
  cnpj: gerarCNPJ(),
  email: `loja.${sufixo()}@e2e.test`,
  celular: gerarCelular(),
  cep: "36010000",
  logradouro: "Rua Teste",
  numero: "10",
  bairro: "Centro",
  cidade: "Juiz De Fora",
  estado: "MG",
});

interface EquipeApi {
  id: string;
  idLoja: number;
}

export function registrarComandos() {
  Cypress.Commands.add("garantirUsuario", () => {
    const { email, senha } = credenciais();
    cy.request({
      method: "POST",
      url: `${API}/auth/login`,
      body: { email, senha },
      failOnStatusCode: false,
    }).then((r) => {
      if (r.status === 200) return;
      cy.request({
        method: "POST",
        url: `${API}/usuarios`,
        body: {
          nome: "Teste",
          sobrenome: "E2E",
          email,
          celular: gerarCelular(),
          cpf: gerarCPF(),
          dtaNascimento: nascimento(30),
          senha,
        },
        failOnStatusCode: false,
      }).then((c) => {
        expect(c.status, "criação do usuário de teste").to.eq(201);
      });
    });
  });

  Cypress.Commands.add("login", () => {
    const { email, senha } = credenciais();
    cy.session(
      ["login-com-loja", email],
      () => {
        cy.garantirUsuario();
        cy.request("POST", `${API}/auth/login`, { email, senha }).then(({ body }) => {
          expect(body.token, "token JWT").to.match(/^[\w-]+\.[\w-]+\.[\w-]*$/);
          const identidade = { Authorization: `Bearer ${body.token}` };
          window.localStorage.setItem(
            "usuario",
            JSON.stringify({ id: body.id, nome: body.nome, email: body.email }),
          );

          // Sem loja, as rotas de negócio respondem 403: cria a primeira (quem cria vira GERENTE).
          if ((body.equipes ?? []).length === 0) {
            cy.request({
              method: "POST",
              url: `${API}/lojas`,
              headers: identidade,
              body: dadosLoja("Loja E2E principal"),
            });
          }

          cy.request<EquipeApi[]>({
            url: `${API}/usuarios/${body.id}/equipes`,
            headers: identidade,
          }).then(({ body: equipes }) => {
            // Sempre a mesma loja (a mais antiga), para os dados dos testes não se espalharem.
            const [equipe] = [...equipes].sort((a, b) => a.idLoja - b.idLoja);
            cy.request({
              method: "POST",
              url: `${API}/auth/trocar-contexto`,
              headers: identidade,
              body: { equipeId: equipe.id },
            }).then(({ body: ctx }) => {
              window.localStorage.setItem("token", ctx.token);
              window.localStorage.setItem(
                "loja_ativa",
                JSON.stringify({
                  equipeId: ctx.equipeId,
                  lojaId: ctx.lojaId,
                  nomeLoja: ctx.lojaNome,
                  cargo: ctx.cargoNome,
                  permissoes: ctx.permissoes,
                }),
              );
              Cypress.env("TOKEN_ATUAL", ctx.token);
            });
          });
        });
      },
      {
        validate() {
          cy.window()
            .its("localStorage")
            .invoke("getItem", "token")
            .should("match", /^[\w-]+\./);
          cy.window().its("localStorage").invoke("getItem", "loja_ativa").should("be.a", "string");
        },
        cacheAcrossSpecs: true,
      },
    );
  });

  Cypress.Commands.add("token", () => cy.window().its("localStorage").invoke("getItem", "token"));

  Cypress.Commands.add("api", (metodo: string, caminho: string, corpo?: unknown, falhar = true) => {
    return cy.token().then((token) =>
      cy.request({
        method: metodo,
        url: `${API}${caminho}`,
        body: corpo as Cypress.RequestBody,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: falhar,
      }),
    );
  });

  Cypress.Commands.add("criarLoja", (nome = `Loja E2E ${sufixo()}`) =>
    cy.api<{ id: number; nome: string }>("POST", "/lojas", dadosLoja(nome)).its("body"),
  );

  // idLoja continua nos comandos abaixo por compatibilidade, mas a API ignora:
  // tudo é gravado na loja do token (loja ativa).
  Cypress.Commands.add("criarArea", (idLoja: number, nome = `Área E2E ${sufixo()}`) =>
    cy
      .api<{ id: number; nome: string }>("POST", "/AreasAtuacoes", {
        nome,
        descricao: "Criada pelo E2E",
        idLoja,
      })
      .its("body"),
  );

  Cypress.Commands.add("criarFuncionario", (idLoja: number, nome = `Func${sufixo()}`) =>
    cy
      .api<{ id: number; nome: string }>("POST", "/funcionarios", {
        nome,
        sobrenome: "E2E",
        cpf: gerarCPF(),
        dtaNascimento: nascimento(28),
        email: `func.${sufixo()}@e2e.test`,
        celular: gerarCelular(),
        idLoja,
      })
      .its("body"),
  );

  Cypress.Commands.add("criarCliente", (idLoja: number, nome = `Cliente${sufixo()}`) =>
    cy
      .api<{ id: number; nome: string }>("POST", "/clientes", {
        nome,
        sobreNome: "E2E",
        cpf: gerarCPF(),
        email: `cli.${sufixo()}@e2e.test`,
        celular: gerarCelular(),
        dtaNascimento: nascimento(35),
        idLoja,
      })
      .its("body"),
  );

  Cypress.Commands.add(
    "criarServico",
    (idLoja: number, idArea: number, nome = `Serviço E2E ${sufixo()}`) =>
      cy
        .api<{ id: number; nome: string }>("POST", "/servicos", {
          nome,
          preco: 80,
          comissaoLoja: 30,
          descricao: "Criado pelo E2E",
          idLoja,
          idArea,
        })
        .its("body"),
  );

  Cypress.Commands.add("lojaAtiva", () =>
    cy
      .window()
      .its("localStorage")
      .invoke("getItem", "loja_ativa")
      .then((raw) => {
        const loja = JSON.parse(String(raw));
        return { id: loja.lojaId as number, nome: loja.nomeLoja as string };
      }),
  );

  Cypress.Commands.add("lojaDeTeste", () => cy.lojaAtiva());
}
