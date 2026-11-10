// @requisito RNR-11 RNR-20 RE-02
/**
 * Regras de negócio da rodada 2 (tela). As regras em si são testadas no backend
 * (RegrasNegocioTest); aqui as respostas da API são simuladas com cy.intercept para
 * conferir o que o usuário vê:
 * - RNR-11: na comanda, cada profissional só lista os serviços das áreas dele;
 * - RNR-20: sem plano, a segunda loja é recusada e a tela leva para /plano;
 * - RE-02: telefone opcional da loja, com máscara e enviado só com dígitos.
 */
import { gerarCNPJ, gerarCelular, hojeISO, sufixo } from "../support/dados";

const API = "/api/v1";

const FUNCIONARIOS = [
  { id: 9101, nome: "Ana", sobrenome: "Cabelo", area: [{ id: 10, nome: "Cabelo" }] },
  { id: 9102, nome: "Bia", sobrenome: "Unhas", area: [{ id: 20, nome: "Unhas" }] },
  { id: 9103, nome: "Cris", sobrenome: "Geral", area: [] },
];

const SERVICOS = [
  { id: 9201, nome: "Corte RNR", preco: 50, idArea: 10, nomeArea: "Cabelo" },
  { id: 9202, nome: "Manicure RNR", preco: 30, idArea: 20, nomeArea: "Unhas" },
];

const CAIXA_ABERTO = {
  id: 1,
  status: "ABERTO",
  abertoEm: `${hojeISO()}T08:00:00`,
  valorInicial: 0,
  suprimentos: 0,
  sangrias: 0,
  vendas: 0,
  vendasPorForma: {},
  outrasEntradas: 0,
  outrasSaidas: 0,
  saldoDinheiro: 0,
};

/** Agenda com um único atendimento simulado e a comanda aberta para ele. */
const abrirComanda = (idFuncionario: number, idServico: number) => {
  const servico = SERVICOS.find((s) => s.id === idServico)!;
  const func = FUNCIONARIOS.find((f) => f.id === idFuncionario)!;
  cy.intercept("GET", `${API}/agendamentos*`, {
    body: [
      {
        id: 9301,
        data: hojeISO(),
        horarioInicio: "09:00:00",
        horarioFim: "09:30:00",
        status: "AGENDADO",
        nomeCliente: "Cliente RNR",
        nomeFuncionario: func.nome, // o backend manda só o nome (AgendamentoDTO)
        nomeServico: servico.nome,
        idFuncionario,
        idServico,
      },
    ],
  }).as("agendamentos");
  cy.intercept("GET", `${API}/funcionarios`, { body: FUNCIONARIOS });
  cy.intercept("GET", `${API}/servicos`, { body: SERVICOS });
  cy.intercept("GET", `${API}/caixas/atual`, { body: CAIXA_ABERTO });
  cy.visit("/agenda");
  cy.wait("@agendamentos");
  cy.contains("[data-cy=agendamento]", "Cliente RNR").click({ scrollBehavior: "center" });
  cy.get("[data-cy=fechar-atendimento]").click();
  cy.get("[data-cy=modal-comanda]").should("be.visible");
};

describe("Regras de negócio", () => {
  beforeEach(() => cy.login());

  // ------------------------------------------------------------ RNR-11
  describe("RNR-11 · comanda só com serviços da área do profissional", () => {
    it("lista só os serviços da área do profissional escolhido", () => {
      abrirComanda(9101, 9201);
      cy.get("[data-cy=comanda-servico]")
        .first()
        .within(() => {
          cy.contains("option", "Corte RNR").should("exist");
          cy.contains("option", "Manicure RNR").should("not.exist");
        });
      // Profissional sem área cadastrada não tem restrição.
      cy.get("[data-cy=comanda-profissional]").first().select("Cris Geral");
      cy.get("[data-cy=comanda-servico]").first().find("option").should("have.length", 3);
    });

    it("trocar para um profissional de outra área limpa o serviço", () => {
      abrirComanda(9101, 9201);
      // Com "Corte" escolhido, só aparece quem atende Cabelo: limpa o serviço para ver todos.
      cy.get("[data-cy=comanda-servico]").first().select("");
      cy.get("[data-cy=comanda-profissional]").first().select("Bia Unhas");
      cy.get("[data-cy=comanda-servico]").first().should("have.value", "");
      cy.get("[data-cy=comanda-servico]")
        .first()
        .within(() => cy.contains("option", "Corte RNR").should("not.exist"));
      cy.get("[data-cy=comanda-servico]").first().select("Manicure RNR");
      cy.get("[data-cy=comanda-valor]").first().should("have.value", "30,00");
    });

    it("lista só os profissionais que atendem o serviço", () => {
      abrirComanda(9102, 9202);
      cy.get("[data-cy=comanda-profissional]")
        .first()
        .within(() => {
          cy.contains("option", "Bia Unhas").should("exist");
          cy.contains("option", "Cris Geral").should("exist");
          cy.contains("option", "Ana Cabelo").should("not.exist");
        });
    });

    it("agendamento fora da área avisa e não envia", () => {
      abrirComanda(9101, 9202);
      cy.get("[data-cy=comanda-aviso-area]").should(
        "contain",
        "Ana Cabelo não atende serviços de Unhas",
      );
      cy.intercept("POST", `${API}/comandas`, cy.spy().as("enviou"));
      cy.get("[data-cy=comanda-salvar]").click();
      cy.get("[data-cy=comanda-erro]").should("contain", "não atende serviços de Unhas");
      cy.get("@enviou").should("not.have.been.called");
    });

    it("erro 400 do backend aparece na comanda", () => {
      abrirComanda(9101, 9201);
      cy.intercept("POST", `${API}/comandas`, {
        statusCode: 400,
        body: "Ana não atende serviços de Cabelo. Escolha um profissional dessa área ou outro serviço.",
      }).as("comanda");
      cy.get("[data-cy=comanda-salvar]").click();
      cy.wait("@comanda");
      cy.get("[data-cy=comanda-erro]").should("contain", "não atende serviços de Cabelo");
    });
  });

  // ------------------------------------------------------------ Loja
  const preencherLoja = (nome: string) => {
    cy.get("[data-cy=form-nome]").type(nome);
    cy.get("[data-cy=form-cnpj]").type(gerarCNPJ());
    cy.get("[data-cy=form-email]").type(`loja.${sufixo()}@e2e.test`);
    cy.get("[data-cy=form-celular]").type(gerarCelular());
    cy.get("[data-cy=form-cep]").type("36010000");
    cy.get("[data-cy=form-logradouro]").type("Rua Halfeld");
    cy.get("[data-cy=form-numero]").type("500");
    cy.get("[data-cy=form-bairro]").type("Centro");
    cy.get("[data-cy=form-cidade]").type("Juiz de Fora");
    cy.get("[data-cy=form-estado]").select("MG");
  };

  describe("RNR-20 · sem plano não cria outra loja", () => {
    it("mostra a mensagem e o caminho para o plano", () => {
      cy.intercept("POST", `${API}/lojas`, {
        statusCode: 400,
        body: "Para criar outra loja, assine um plano em uma das suas lojas.",
      }).as("criar");
      cy.visit("/cadastro-loja");
      preencherLoja("Segunda loja");
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar");
      cy.get("[data-cy=aviso-sem-plano]")
        .should("be.visible")
        .and("contain", "assine um plano em uma das suas lojas");
      cy.location("pathname").should("eq", "/cadastro-loja");
      cy.get("[data-cy=ir-para-plano]").should("have.attr", "href", "/plano").click();
      cy.location("pathname").should("eq", "/plano");
    });
  });

  describe("RE-02 · telefone da loja", () => {
    it("aplica a máscara e envia só os dígitos", () => {
      cy.intercept("POST", `${API}/lojas`, { statusCode: 400, body: "Parado pelo teste" }).as(
        "criar",
      );
      cy.visit("/cadastro-loja");
      preencherLoja("Loja com telefone");
      cy.get("[data-cy=form-telefone]").type("3232154000").should("have.value", "(32) 3215-4000");
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").its("request.body.telefone").should("eq", "3232154000");
    });

    it("telefone é opcional", () => {
      cy.intercept("POST", `${API}/lojas`, { statusCode: 400, body: "Parado pelo teste" }).as(
        "criar",
      );
      cy.visit("/cadastro-loja");
      preencherLoja("Loja sem telefone");
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").its("request.body").should("not.have.property", "telefone");
    });

    it("telefone inválido é barrado no front", () => {
      cy.intercept("POST", `${API}/lojas`, cy.spy().as("enviou"));
      cy.visit("/cadastro-loja");
      preencherLoja("Loja telefone ruim");
      cy.get("[data-cy=form-telefone]").type("3212");
      cy.get("[data-cy=form-salvar]").click();
      cy.get("#campo-telefone-erro").should("contain", "Telefone inválido");
      cy.get("@enviou").should("not.have.been.called");
    });
  });
});
