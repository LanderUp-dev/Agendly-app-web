// @requisito RO-04 RO-26 RO-27 RND-04 RND-05
/**
 * Fidelidade de ponta a ponta: configura N = 2, fecha 2 comandas do mesmo cliente pela API
 * (com caixa aberto) e confere o histórico do cliente (visitas, total, progresso) e o marco
 * na tela de fidelidade. Serviço do E2E: R$ 80 (cy.criarServico).
 * O caixa só é fechado no fim se foi este teste que o abriu; a configuração anterior volta no after.
 */
import { sufixo } from "../support/dados";

interface ConfigFidelidade {
  ativo: boolean;
  visitasParaRecompensa: number;
  recompensa: string | null;
  enviarEmail: boolean;
}

describe("Fidelidade: histórico do cliente e recompensa", () => {
  const nomeCliente = `CliFiel${sufixo().replace(/\d/g, "")}`;
  const recompensa = `Corte grátis ${sufixo()}`;
  let clienteId = 0;
  let abriCaixa = false;
  let configAnterior: ConfigFidelidade | null = null;

  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    cy.api<ConfigFidelidade>("GET", "/fidelidade").then((r) => {
      configAnterior = r.body;
    });
    // enviarEmail desligado: o cliente do E2E tem e-mail fictício
    cy.api("PUT", "/fidelidade", {
      ativo: true,
      visitasParaRecompensa: 2,
      recompensa,
      enviarEmail: false,
    })
      .its("status")
      .should("eq", 200);

    cy.api("GET", "/caixas/atual").then((r) => {
      if (r.status === 204) {
        abriCaixa = true;
        cy.api("POST", "/caixas", { valorInicial: 0 }).its("status").should("eq", 201);
      }
    });

    cy.lojaDeTeste().then((loja) => {
      cy.criarArea(loja.id).then((area) => {
        cy.criarServico(loja.id, area.id, "Corte Fiel").then((servico) => {
          cy.criarFuncionario(loja.id, `Fiel${sufixo().replace(/\d/g, "")}`).then((func) => {
            cy.criarCliente(loja.id, nomeCliente).then((cliente) => {
              clienteId = cliente.id;
              const comanda = {
                idCliente: cliente.id,
                itens: [{ idServico: servico.id, idFuncionario: func.id }],
                pagamentos: [{ forma: "PIX", valor: 80 }],
              };
              cy.api("POST", "/comandas", comanda).its("status").should("eq", 201);
              cy.api("POST", "/comandas", comanda).its("status").should("eq", 201);
            });
          });
        });
      });
    });
  });

  after(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    if (abriCaixa) cy.api("POST", "/caixas/atual/fechar", {}, false);
    const anterior = configAnterior as ConfigFidelidade | null;
    if (anterior) cy.api("PUT", "/fidelidade", anterior, false);
  });

  beforeEach(() => cy.login());

  it("abre o histórico pela listagem de clientes e mostra visitas e fidelidade", () => {
    cy.visit("/listagem-clientes");
    cy.get("[data-cy=busca]").type(nomeCliente);
    cy.get(`[data-cy=cliente-historico-${clienteId}]`).click();

    cy.location("pathname").should("eq", "/cliente-historico");
    cy.location("search").should("contain", `id=${clienteId}`);
    cy.get("[data-cy=historico-visitas]").should("have.text", "2");
    cy.get("[data-cy=historico-total]").should("contain", "160,00");
    cy.get("[data-cy=historico-fidelidade]")
      .should("contain", "0 de 2")
      .and("contain", `Faltam 2 visitas para ${recompensa}`);
    cy.get("[data-cy=historico-recompensas]").should("contain", "1 recompensa");
    cy.get("[data-cy=historico-comandas] tbody tr").should("have.length", 2);
    cy.get("[data-cy=historico-comandas]").should("contain", "Corte Fiel").and("contain", "Pix");
  });

  it("a tela de fidelidade mostra a configuração e o cliente que completou o ciclo", () => {
    cy.visit("/fidelidade");
    cy.get("[data-cy=fidelidade-ativo]").should("be.checked");
    cy.get("[data-cy=fidelidade-visitas]").should("have.value", "2");
    cy.get("[data-cy=fidelidade-recompensa]").should("have.value", recompensa);
    cy.get(`[data-cy=marco-${clienteId}]`)
      .should("contain", nomeCliente)
      .and("contain", recompensa)
      .and("contain", "2");
  });

  it("recusa número de visitas fora de 2 a 100", () => {
    cy.visit("/fidelidade");
    cy.get("[data-cy=fidelidade-visitas]").clear().type("1");
    cy.get("[data-cy=fidelidade-salvar]").click();
    cy.get("[data-cy=fidelidade-erro]").should("contain", "entre 2 e 100");
  });
});
