// @requisito RE-08 RO-22 RNR-18 RNF-01 RNF-05
/**
 * Despesas de ponta a ponta: cria uma despesa de R$ 100 em 3 parcelas (1ª vence hoje),
 * paga a 1ª pelo caixa (Pix) e confere os totais do mês (comparando com antes do teste,
 * pois a loja de teste é compartilhada com outras specs).
 */
import { sufixo } from "../support/dados";

interface Resumo {
  totalAberto: number;
  totalVencido: number;
  totalPago: number;
}

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const centavos = (v: number) => Math.round(v * 100);

describe("Despesas: parcelas, pagamento pelo caixa e totais", () => {
  const nome = `Desp${sufixo()}`;
  let abriuCaixa = false;
  let antes: Resumo;
  let idSegundaParcela: number | null = null;

  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    cy.lojaDeTeste();
    cy.api("GET", "/caixas/atual").then((r) => {
      if (r.status !== 200) {
        cy.api("POST", "/caixas", { valorInicial: 100 }).then(() => {
          abriuCaixa = true;
        });
      }
    });
    cy.api<Resumo>("GET", "/despesas/resumo").then((r) => {
      antes = r.body;
    });
  });

  after(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    // limpa as parcelas ainda em aberto deste teste (a paga fica)
    if (idSegundaParcela) {
      cy.api("DELETE", `/despesas/${idSegundaParcela}?todasAsParcelas=true`, undefined, false);
    }
    if (abriuCaixa) cy.api("POST", "/caixas/atual/fechar", {});
  });

  beforeEach(() => cy.login());

  it("cria em 3 parcelas, paga a 1ª pelo caixa e confere os totais", () => {
    cy.intercept("GET", "/api/v1/despesas*").as("lista");
    cy.visit("/despesas");
    cy.wait("@lista");

    cy.get("[data-cy=despesa-nova]").click();
    cy.get("[data-cy=modal-despesa]").should("be.visible");
    cy.get("[data-cy=despesa-nome]").type(nome);
    cy.get("[data-cy=despesa-valor]").type("100");
    cy.get("[data-cy=despesa-parcelas]").clear().type("3");
    cy.get("[data-cy=despesa-previa]").should("contain", "33,34").and("contain", "33,33");
    cy.intercept("POST", "/api/v1/despesas").as("criar");
    cy.get("[data-cy=despesa-salvar]").click();
    cy.wait("@criar").then(({ response }) => {
      expect(response?.body).to.have.length(3);
      idSegundaParcela = response?.body[1].id;
    });
    cy.wait("@lista");

    // só a 1ª parcela vence neste mês
    cy.contains("[data-cy=despesa-linha]", nome)
      .should("contain", "(1/3)")
      .and("contain", "33,34")
      .and("contain", "Em aberto");
    cy.get("[data-cy=despesa-total-aberto]").should(
      "contain",
      brl((centavos(antes.totalAberto) + 3334) / 100),
    );

    cy.contains("[data-cy=despesa-linha]", nome).find("[data-cy=despesa-pagar]").click();
    cy.get("[data-cy=modal-pagar-despesa]").should("be.visible");
    cy.get("[data-cy=despesa-caixa-info]").should("contain", "Dinheiro no caixa aberto");
    cy.get("[data-cy=despesa-forma]").select("PIX");
    cy.get("[data-cy=despesa-sai-do-caixa]").check();
    cy.intercept("POST", "/api/v1/despesas/*/pagar").as("pagar");
    cy.get("[data-cy=despesa-confirmar-pagamento]").click();
    cy.wait("@pagar").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body.saiuDoCaixa).to.eq(true);
      expect(response?.body.status).to.eq("PAGA");
    });
    cy.wait("@lista");

    cy.contains("[data-cy=despesa-linha]", nome)
      .should("contain", "Paga")
      .and("contain", "saiu do caixa");
    cy.get("[data-cy=despesa-total-aberto]").should("contain", brl(antes.totalAberto));
    cy.get("[data-cy=despesa-total-pago]").should(
      "contain",
      brl((centavos(antes.totalPago) + 3334) / 100),
    );
    cy.get("[data-cy=despesa-total-vencido]").should("contain", brl(antes.totalVencido));

    // o pagamento aparece no caixa
    cy.api<{ movimentos: { tipo: string; descricao: string }[] }>("GET", "/caixas/atual")
      .its("body.movimentos")
      .should((movs: { tipo: string; descricao: string }[]) => {
        expect(movs.some((m) => m.tipo === "DESPESA" && m.descricao.includes(nome))).to.eq(true);
      });

    // pago pelo caixa não pode ser desfeito aqui
    cy.on("window:confirm", () => true);
    cy.contains("[data-cy=despesa-linha]", nome).find("[data-cy=despesa-desfazer]").click();
    cy.contains("[data-cy=despesa-linha]", nome).should("contain", "Paga");
  });
});
