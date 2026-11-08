// @requisito RE-09 RR-29 RR-31 RO-15 RO-23 RNR-17 RNF-02 RNF-06
/**
 * Recebimentos (fiado): cria um recebimento parcelado para um cliente, vê o aviso de
 * pendência ao criar outro para o mesmo cliente e recebe uma parcela pelo caixa aberto.
 * Abre o caixa pela API se não houver um; fecha no fim só se foi este teste que abriu.
 */
import { hojeISO, sufixo } from "../support/dados";

describe("Recebimentos: parcelas, pendência e caixa", () => {
  const nomeCliente = `CliRec${sufixo().replace(/\d/g, "")}`;
  const nomeConta = `Pacote ${sufixo()}`;
  let idCliente = 0;
  let abriCaixa = false;

  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    cy.lojaDeTeste().then((loja) => {
      cy.criarCliente(loja.id, nomeCliente).then((c) => {
        idCliente = c.id;
      });
    });
    cy.api("GET", "/caixas/atual").then((r) => {
      if (r.status !== 200) {
        abriCaixa = true;
        cy.api("POST", "/caixas", { valorInicial: 0 }).its("status").should("eq", 201);
      }
    });
  });

  beforeEach(() => cy.login());

  after(() => {
    if (!abriCaixa) return;
    cy.login();
    cy.visit("/listagem-lojas");
    cy.api("POST", "/caixas/atual/fechar", {}, false);
  });

  const abrirNovo = () => {
    cy.get("[data-cy=recebimento-novo]").click();
    cy.get("[data-cy=modal-recebimento]").should("be.visible");
  };

  it("cria um recebimento em 3 parcelas para o cliente", () => {
    cy.intercept("GET", "/api/v1/recebimentos*").as("lista");
    cy.visit("/recebimentos");
    cy.wait("@lista");
    abrirNovo();
    cy.get("[data-cy=recebimento-cliente]").select(String(idCliente));
    cy.get("[data-cy=recebimento-nome]").type(nomeConta);
    cy.get("[data-cy=recebimento-valor]").type("100");
    cy.get("[data-cy=recebimento-vencimento]").clear().type(hojeISO());
    cy.get("[data-cy=recebimento-parcelas]").clear().type("3");
    cy.get("[data-cy=recebimento-salvar]").click();
    cy.get("[data-cy=modal-recebimento]").should("not.exist");

    // Parcela 1/3 vence neste mês, com os centavos que sobraram
    cy.contains("[data-cy=recebimento-linha]", nomeConta)
      .should("contain", "1/3")
      .and("contain", "33,34")
      .and("contain", "Em aberto");
  });

  it("avisa a pendência ao criar outro recebimento para o mesmo cliente", () => {
    cy.visit("/recebimentos");
    abrirNovo();
    cy.get("[data-cy=pendencia-cliente]").should("not.exist");
    cy.get("[data-cy=recebimento-cliente]").select(String(idCliente));
    cy.get("[data-cy=pendencia-cliente]")
      .should("be.visible")
      .and("contain", "3 contas em aberto")
      .and("contain", "100,00");
    // Obrigatórios: sem nome não salva
    cy.get("[data-cy=recebimento-valor]").type("10");
    cy.get("[data-cy=recebimento-salvar]").click();
    cy.get("[data-cy=recebimento-erro]").should("contain", "Informe o nome");
    cy.get("[data-cy=modal-recebimento]").contains("button", "Voltar").click();
  });

  it("recebe a 1ª parcela pelo caixa aberto", () => {
    cy.intercept("POST", "/api/v1/recebimentos/*/receber").as("receber");
    cy.visit("/recebimentos");
    cy.contains("[data-cy=recebimento-linha]", nomeConta).find("[data-cy^=receber-]").click();
    cy.get("[data-cy=modal-receber]").should("be.visible");
    cy.get("[data-cy=receber-forma]").select("PIX");
    cy.get("[data-cy=receber-no-caixa]").should("be.enabled").and("be.checked");
    cy.get("[data-cy=receber-confirmar]").click();
    cy.wait("@receber").its("response.statusCode").should("eq", 200);

    cy.contains("[data-cy=recebimento-linha]", nomeConta)
      .should("contain", "Recebido")
      .and("contain", "no caixa");
    cy.get("[data-cy=resumo-recebido]").should("not.contain", "R$ 0,00");

    // Entrou no caixa como recebimento
    cy.api<{ movimentos: { tipo: string; descricao?: string }[] }>("GET", "/caixas/atual")
      .its("body.movimentos")
      .should((movs: { tipo: string; descricao?: string }[]) => {
        expect(
          movs.some((m) => m.tipo === "RECEBIMENTO" && (m.descricao ?? "").includes(nomeConta)),
        ).to.eq(true);
      });

    // Pendência caiu para 2 parcelas
    cy.api<{ quantidade: number }>("GET", `/recebimentos/pendencias?cliente=${idCliente}`)
      .its("body.quantidade")
      .should("eq", 2);
  });
});
