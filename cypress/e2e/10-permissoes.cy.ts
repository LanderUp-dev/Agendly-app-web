// @requisito RS-02 RO-28
import { gerarCPF, gerarCelular, nascimento, sufixo } from "../support/dados";

/**
 * S1 — permissões por cargo. Quem é adicionado à equipe sem cargo vira COLABORADOR:
 * usa agenda e clientes, vê o resto, mas não altera funcionários, serviços, equipe,
 * loja nem cobrancistas. O backend barra (403 com mensagem) e o front esconde.
 */
const API = "/api/v1";

describe("Permissões por cargo", () => {
  const colaborador = {
    email: `colab.${sufixo()}@e2e.test`,
    // Senha de teste gerada na hora (não é segredo de nenhum ambiente real).
    senha: `Colab${Date.now()}x`,
  };

  before(() => {
    cy.request("POST", `${API}/usuarios`, {
      nome: "Colaborador",
      sobrenome: "E2E",
      email: colaborador.email,
      celular: gerarCelular(),
      cpf: gerarCPF(),
      dtaNascimento: nascimento(25),
      senha: colaborador.senha,
    });
    // O gerente (usuário padrão dos testes) adiciona o colaborador à loja dele.
    cy.login();
    cy.visit("/listagem-equipes");
    cy.api("POST", "/equipes", { emailUsuario: colaborador.email })
      .its("body.nomeCargo")
      .should("eq", "COLABORADOR");
  });

  /** Entra como colaborador na loja do gerente (mesmo fluxo do app: login + trocar-contexto). */
  const entrarComoColaborador = () => {
    cy.session(["colaborador", colaborador.email], () => {
      cy.request("POST", `${API}/auth/login`, colaborador).then(({ body }) => {
        const identidade = { Authorization: `Bearer ${body.token}` };
        window.localStorage.setItem(
          "usuario",
          JSON.stringify({ id: body.id, nome: body.nome, email: body.email }),
        );
        cy.request({
          method: "POST",
          url: `${API}/auth/trocar-contexto`,
          headers: identidade,
          body: { equipeId: body.equipes[0].id },
        }).then(({ body: ctx }) => {
          expect(ctx.cargoNome).to.eq("COLABORADOR");
          expect(ctx.permissoes).to.include("AGENDAMENTO_EDITAR").and.not.include("EQUIPE_EDITAR");
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
        });
      });
    });
  };

  const tokenAtual = () => cy.window().its("localStorage").invoke("getItem", "token");

  it("API: colaborador lista clientes, mas não exclui cliente nem cadastra funcionário", () => {
    entrarComoColaborador();
    cy.visit("/agenda");
    tokenAtual().then((token) => {
      const headers = { Authorization: `Bearer ${token}` };
      cy.request({ url: `${API}/clientes`, headers })
        .its("status")
        .should("eq", 200);
      cy.request({
        method: "DELETE",
        url: `${API}/clientes/999999`,
        headers,
        failOnStatusCode: false,
      }).then((r) => {
        expect(r.status).to.eq(403);
        expect(r.body).to.contain("não tem permissão");
      });
      cy.request({
        method: "POST",
        url: `${API}/funcionarios`,
        headers,
        body: { nome: "Nao Pode" },
        failOnStatusCode: false,
      })
        .its("status")
        .should("eq", 403);
    });
  });

  it("menu esconde o que o cargo não pode ver (Cobrancistas)", () => {
    entrarComoColaborador();
    cy.visit("/agenda");
    cy.get("[data-cy=navbar]").should("contain", "Clientes");
    cy.get("[data-cy=menu-navegacao]").click();
    cy.get("[role=menu]").should("contain", "Equipes").and("not.contain", "Cobrancistas");
  });

  it("sem permissão de cadastrar, o botão Novo some; com permissão, aparece", () => {
    entrarComoColaborador();
    cy.visit("/listagem-funcionarios");
    cy.get("h1").should("contain", "Funcionários");
    cy.get("[data-cy=botao-novo]").should("not.exist");
    cy.visit("/listagem-clientes");
    cy.get("[data-cy=botao-novo]").should("exist");
  });

  it("abrir direto uma tela sem permissão leva para a agenda", () => {
    entrarComoColaborador();
    cy.visit("/cadastro-funcionario");
    cy.location("pathname").should("eq", "/agenda");
    cy.visit("/listagem-cobrancistas");
    cy.location("pathname").should("eq", "/agenda");
  });

  it("403 por permissão mostra a mensagem e NÃO encerra a sessão", () => {
    entrarComoColaborador();
    // Simula um front desatualizado que ainda mostra a tela: o backend barra.
    cy.visit("/agenda", {
      onBeforeLoad(w) {
        const loja = JSON.parse(w.localStorage.getItem("loja_ativa") ?? "{}");
        w.localStorage.setItem("loja_ativa", JSON.stringify({ ...loja, permissoes: undefined }));
      },
    });
    cy.intercept("GET", "/api/v1/cobrancistas").as("cobrancistas");
    cy.visit("/listagem-cobrancistas");
    cy.wait("@cobrancistas").its("response.statusCode").should("eq", 403);
    cy.contains("não tem permissão").should("exist");
    cy.location("pathname").should("eq", "/listagem-cobrancistas");
    cy.window()
      .its("localStorage")
      .invoke("getItem", "token")
      .should("match", /^[\w-]+\./);
  });

  it("gerente continua vendo o botão Novo em funcionários", () => {
    cy.login();
    cy.visit("/listagem-funcionarios");
    cy.get("[data-cy=botao-novo]").should("exist");
  });
});
