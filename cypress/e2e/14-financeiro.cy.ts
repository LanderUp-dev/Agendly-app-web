// @requisito RE-06 RE-07 RO-07 RO-09 RO-10 RO-11 RO-12 RO-13 RO-14 RO-42 RNR-08
/**
 * Módulo financeiro de ponta a ponta: abrir o caixa, suprimento e sangria, fechar um
 * atendimento da agenda (Pix + dinheiro com troco), ver no caixa e no painel, cancelar a
 * comanda (estorno) e fechar o caixa conferindo o dinheiro.
 * Serviço do E2E: R$ 80 (cy.criarServico).
 */
import { hojeISO, sufixo } from "../support/dados";

describe("Financeiro: caixa, comanda e painel", () => {
  const nomeFunc = `Fin${sufixo().replace(/\d/g, "")}`;
  const nomeCliente = `CliFin${sufixo().replace(/\d/g, "")}`;

  /** Fecha o caixa que estiver aberto (execução anterior interrompida). */
  const fecharCaixaSeAberto = () =>
    cy.api("GET", "/caixas/atual").then((r) => {
      if (r.status === 200) cy.api("POST", "/caixas/atual/fechar", {});
    });

  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    fecharCaixaSeAberto();
    cy.lojaDeTeste().then((loja) => {
      cy.criarArea(loja.id).then((area) => {
        cy.criarServico(loja.id, area.id, "Corte Financeiro").then((servico) => {
          cy.criarFuncionario(loja.id, nomeFunc).then((func) => {
            cy.criarCliente(loja.id, nomeCliente).then((cliente) => {
              cy.api("POST", "/agendamentos", {
                data: hojeISO(),
                horarioInicio: "07:00:00",
                idFuncionario: func.id,
                idCliente: cliente.id,
                idServico: servico.id,
              })
                .its("status")
                .should("eq", 201);
            });
          });
        });
      });
    });
  });

  beforeEach(() => cy.login());

  const abrirAtendimento = () => {
    cy.intercept("GET", "/api/v1/agendamentos").as("agendamentos");
    cy.visit("/agenda");
    cy.wait("@agendamentos");
    cy.contains("[data-cy=agendamento]", nomeCliente).click({ scrollBehavior: "center" });
    cy.get("[data-cy=fechar-atendimento]").click();
    cy.get("[data-cy=modal-comanda]").should("be.visible");
  };

  it("sem caixa aberto a comanda avisa para abrir o caixa", () => {
    abrirAtendimento();
    cy.get("[data-cy=comanda-sem-caixa]").should("contain", "Não há caixa aberto");
  });

  it("abre o caixa, faz suprimento e recusa sangria maior que o dinheiro", () => {
    cy.visit("/caixa");
    cy.get("[data-cy=caixa-fechado]").should("be.visible");
    cy.get("[data-cy=caixa-abrir]").click();
    cy.get("[data-cy=caixa-valor]").type("100");
    cy.get("[data-cy=caixa-confirmar]").click();
    cy.get("[data-cy=caixa-saldo]").should("contain", "100,00");

    cy.get("[data-cy=caixa-suprimento]").click();
    cy.get("[data-cy=caixa-valor]").type("20");
    cy.get("[data-cy=caixa-texto]").type("Troco");
    cy.get("[data-cy=caixa-confirmar]").click();
    cy.get("[data-cy=caixa-saldo]").should("contain", "120,00");

    cy.get("[data-cy=caixa-sangria]").click();
    cy.get("[data-cy=caixa-valor]").type("500");
    cy.get("[data-cy=caixa-confirmar]").click();
    cy.get("[data-cy=caixa-erro]").should("contain", "maior que o dinheiro no caixa");
    cy.get("[data-cy=caixa-valor]").clear().type("10");
    cy.get("[data-cy=caixa-confirmar]").click();
    cy.get("[data-cy=caixa-saldo]").should("contain", "110,00");
    cy.get("[data-cy=caixa-movimentos]").should("contain", "Sangria");
  });

  it("fecha o atendimento da agenda com Pix + dinheiro e troco", () => {
    abrirAtendimento();
    cy.get("[data-cy=comanda-total]").should("contain", "80,00");
    cy.get("[data-cy=comanda-profissional]").find("option:selected").should("contain", nomeFunc);
    cy.get("[data-cy=comanda-pago]").first().clear().type("50");
    cy.get("[data-cy=comanda-situacao]").should("contain", "Falta receber");
    cy.get("[data-cy=comanda-adicionar-pagamento]").click();
    cy.get("[data-cy=comanda-forma]").last().should("have.value", "DINHEIRO");
    cy.get("[data-cy=comanda-pago]").last().type("50");
    cy.get("[data-cy=comanda-situacao]").should("contain", "Troco").and("contain", "20,00");

    cy.intercept("POST", "/api/v1/comandas").as("comanda");
    cy.get("[data-cy=comanda-salvar]").click();
    cy.wait("@comanda").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.total).to.eq(80);
      expect(response?.body.troco).to.eq(20);
    });

    cy.contains("[data-cy=agendamento]", nomeCliente).click({ scrollBehavior: "center" });
    cy.get("[data-cy=detalhe-status]").should("contain", "Conclu");
    cy.get("[data-cy=atendimento-pago]").should("be.visible");
    cy.get("[data-cy=fechar-atendimento]").should("not.exist");

    cy.visit("/caixa");
    cy.get("[data-cy=caixa-vendas]").should("contain", "80,00");
    cy.get("[data-cy=caixa-saldo]").should("contain", "140,00"); // 110 + 50 − 20 de troco
    cy.get("[data-cy=caixa-formas]").should("contain", "Pix").and("contain", "Dinheiro");
    cy.get("[data-cy=caixa-comandas]").should("contain", nomeCliente);
  });

  it("o painel mostra o faturamento do dia", () => {
    cy.visit("/painel");
    cy.get("[data-cy=painel-periodo-hoje]").click();
    cy.get("[data-cy=painel-atendimentos]").invoke("text").then(Number).should("be.gte", 1);
    cy.get("[data-cy=painel-profissionais]").should("contain", nomeFunc);
    cy.get("[data-cy=painel-formas]").should("contain", "Pix");
  });

  it("cancela a comanda (estorno) e fecha o caixa conferindo o dinheiro", () => {
    cy.visit("/caixa");
    cy.contains("[data-cy=caixa-comandas] tr", nomeCliente).within(() => {
      cy.window().then((w) => cy.stub(w, "prompt").returns("Lançado errado"));
      cy.get("[data-cy^=cancelar-comanda-]").click();
    });
    cy.get("[data-cy=caixa-comandas]").should("contain", "Cancelada");
    cy.get("[data-cy=caixa-saldo]").should("contain", "110,00");

    cy.get("[data-cy=caixa-fechar]").click();
    cy.get("[data-cy=modal-caixa]").should("contain", "110,00");
    cy.get("[data-cy=caixa-valor]").type("108");
    cy.intercept("POST", "/api/v1/caixas/atual/fechar").as("fechar");
    cy.get("[data-cy=caixa-confirmar]").click();
    cy.wait("@fechar").its("response.body.diferenca").should("eq", -2);
    cy.get("[data-cy=caixa-fechado]").should("be.visible");
    cy.get("[data-cy=caixa-historico]").should("contain", "2,00"); // falta de R$ 2,00
  });
});
