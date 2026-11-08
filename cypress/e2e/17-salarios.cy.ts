// @requisito RO-01 RO-02 RO-03 RO-08 RND-03 RNR-06 RNR-07
/**
 * Salários de ponta a ponta: com o caixa aberto, uma comanda (via API) gera comissão para um
 * profissional novo; pela tela fazemos um adiantamento, vemos o extrato e pagamos o salário.
 * Serviço do E2E: R$ 80 com 30% para a loja (cy.criarServico) → profissional recebe R$ 56.
 */
import { sufixo } from "../support/dados";

describe("Salários: comissão, adiantamento e pagamento", () => {
  const nomeFunc = `Sal${sufixo().replace(/\d/g, "")}`;

  /** Abre o caixa se não houver um aberto (com dinheiro para o adiantamento). */
  const garantirCaixaAberto = () =>
    cy.api("GET", "/caixas/atual").then((r) => {
      if (r.status !== 200) cy.api("POST", "/caixas", { valorInicial: 100 });
    });

  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    garantirCaixaAberto();
    cy.lojaDeTeste().then((loja) => {
      cy.criarArea(loja.id).then((area) => {
        cy.criarServico(loja.id, area.id, "Corte Salário").then((servico) => {
          cy.criarFuncionario(loja.id, nomeFunc).then((func) => {
            cy.api("POST", "/comandas", {
              itens: [{ idServico: servico.id, idFuncionario: func.id }],
              pagamentos: [{ forma: "PIX", valor: 80 }],
            })
              .its("status")
              .should("eq", 201);
          });
        });
      });
    });
  });

  beforeEach(() => cy.login());

  const linha = () => cy.contains("[data-cy=salario-linha]", nomeFunc);

  it("mostra a comissão a receber e o extrato", () => {
    cy.visit("/salarios");
    linha().find("[data-cy=salario-a-receber]").should("contain", "56,00");
    linha().find("[data-cy=salario-ver-extrato]").click();
    cy.get("[data-cy=modal-extrato]").should("be.visible");
    cy.get("[data-cy=extrato-itens]").should("contain", "Corte Salário").and("contain", "30%");
    cy.get("[data-cy=extrato-a-receber]").should("contain", "56,00");
  });

  it("recusa adiantamento acima do a receber e registra um válido", () => {
    cy.visit("/salarios");
    linha().find("[data-cy=salario-adiantamento]").click();
    cy.get("[data-cy=adiantamento-maximo]").should("contain", "56,00");
    cy.get("[data-cy=salario-valor]").type("60");
    cy.get("[data-cy=salario-confirmar]").click();
    cy.get("[data-cy=salario-erro]").should("contain", "não pode passar");

    cy.get("[data-cy=salario-valor]").clear().type("20");
    cy.get("[data-cy=salario-forma]").select("PIX");
    cy.intercept("POST", "/api/v1/salarios/*/adiantamentos").as("adiantamento");
    cy.get("[data-cy=salario-confirmar]").click();
    cy.wait("@adiantamento").its("response.statusCode").should("eq", 201);
    linha().find("[data-cy=salario-a-receber]").should("contain", "36,00");
  });

  it("paga o salário perguntando se saiu do caixa", () => {
    cy.visit("/salarios");
    linha().find("[data-cy=salario-pagar]").click();
    cy.get("[data-cy=pagar-valor]").should("contain", "36,00");
    cy.get("[data-cy=pagar-saiu-do-caixa]").should("contain", "Saiu do caixa aberto?");
    cy.get("[data-cy=salario-confirmar]").click();
    cy.get("[data-cy=salario-erro]").should("contain", "caixa aberto");

    cy.get("[data-cy=salario-forma]").select("PIX");
    cy.get("[data-cy=pagar-caixa-sim]").check();
    cy.intercept("POST", "/api/v1/salarios/*/pagar").as("pagar");
    cy.get("[data-cy=salario-confirmar]").click();
    cy.wait("@pagar").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.valorPago).to.eq(36);
      expect(response?.body.adiantamentosDescontados).to.eq(20);
      expect(response?.body.saiuDoCaixa).to.eq(true);
    });
    linha().find("[data-cy=salario-a-receber]").should("contain", "0,00");
    linha().find("[data-cy=salario-pagar]").should("be.disabled");

    linha().find("[data-cy=salario-ver-extrato]").click();
    cy.get("[data-cy=extrato-pagamentos]")
      .should("contain", "36,00")
      .and("contain", "Saiu do caixa");

    cy.visit("/caixa");
    cy.get("[data-cy=caixa-movimentos]").should("contain", `Salário: ${nomeFunc}`);
  });
});
