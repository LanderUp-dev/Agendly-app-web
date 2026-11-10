// @requisito RO-33 RU-01 RO-32
import { sufixo } from "../support/dados";

/**
 * Agenda: filtro por área de atuação (RO-33) e arrastar e soltar (RU-01).
 *
 * A API ainda não tem como ligar funcionário a área (não há endpoint de AreaFuncionario),
 * então o vínculo é colocado na resposta de GET /funcionarios por intercept.
 */
const amanhaISO = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const ponteiro = (clientX: number, clientY: number) => ({
  eventConstructor: "PointerEvent",
  pointerId: 1,
  pointerType: "mouse",
  isPrimary: true,
  button: 0,
  buttons: 1,
  clientX,
  clientY,
});

describe("Agenda: filtro por área e arrastar", () => {
  const letras = () => sufixo().replace(/\d/g, "");
  const prof1 = `Ana${letras()}`;
  const prof2 = `Bia${letras()}`;
  const cliente = `Cli${letras()}`;
  let ids: {
    f1: number;
    f2: number;
    areaA: number;
    areaB: number;
    servico: number;
    cliente: number;
  } | null = null;
  let nomes = { areaA: "", areaB: "" };

  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    cy.lojaDeTeste().then((loja) => {
      cy.criarArea(loja.id, `Cabelo ${letras()}`).then((areaA) => {
        cy.criarArea(loja.id, `Unhas ${letras()}`).then((areaB) => {
          cy.criarServico(loja.id, areaA.id, "Escova Arrastar").then((servico) => {
            cy.criarFuncionario(loja.id, prof1).then((f1) => {
              cy.criarFuncionario(loja.id, prof2).then((f2) => {
                nomes = { areaA: areaA.nome, areaB: areaB.nome };
                cy.criarCliente(loja.id, cliente).then((c) => {
                  ids = {
                    f1: f1.id,
                    f2: f2.id,
                    areaA: areaA.id,
                    areaB: areaB.id,
                    servico: servico.id,
                    cliente: c.id,
                  };
                  cy.api("POST", "/agendamentos", {
                    data: amanhaISO(),
                    horarioInicio: "09:00:00",
                    horarioFim: "10:00:00",
                    status: "AGENDADO",
                    idFuncionario: f1.id,
                    idCliente: c.id,
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
    });
  });

  beforeEach(() => {
    cy.login();
    // prof1 é da área A; prof2 das áreas A e B.
    cy.intercept("GET", "/api/v1/funcionarios", (req) => {
      req.continue((res) => {
        if (!ids || !Array.isArray(res.body)) return;
        const areaA = { id: ids.areaA, nome: nomes.areaA };
        const areaB = { id: ids.areaB, nome: nomes.areaB };
        res.body = res.body.map((f: { id: number }) =>
          f.id === ids!.f1
            ? { ...f, area: [areaA] }
            : f.id === ids!.f2
              ? { ...f, area: [areaA, areaB] }
              : f,
        );
      });
    }).as("funcionarios");
    cy.intercept("GET", "/api/v1/agendamentos").as("agendamentos");
    cy.visit("/agenda");
    cy.wait(["@funcionarios", "@agendamentos"]);
  });

  it("filtra as colunas pela área de atuação e lembra a escolha na sessão", () => {
    cy.get("[data-cy=filtro-area]").select(nomes.areaB);
    cy.contains("[data-cy=agenda-coluna]", prof2).should("exist");
    cy.contains("[data-cy=agenda-coluna]", prof1).should("not.exist");
    // a lista de profissionais do filtro também mostra só os da área
    cy.contains("label", prof1).should("not.exist");

    cy.get("[data-cy=filtro-area]").select(nomes.areaA);
    cy.contains("[data-cy=agenda-coluna]", prof1).should("exist");
    cy.contains("[data-cy=agenda-coluna]", prof2).should("exist");

    // combina com o filtro de profissional: desmarcar esconde mesmo dentro da área
    cy.contains("label", prof2).find("input").uncheck();
    cy.contains("[data-cy=agenda-coluna]", prof2).should("not.exist");
    cy.contains("label", prof2).find("input").check();

    // recarregou a página: a área continua escolhida (sessionStorage)
    cy.reload();
    cy.wait(["@funcionarios", "@agendamentos"]);
    cy.get("[data-cy=filtro-area]").find("option:selected").should("have.text", nomes.areaA);
    cy.get("[data-cy=agenda-coluna]").should("have.length", 2);
  });

  it("arrasta o agendamento para outro profissional e horário, com confirmação", () => {
    cy.get("[data-cy=filtro-area]").select(nomes.areaA);
    cy.get("[data-cy=agenda-proximo]").click();
    cy.get("[data-cy=agenda-grade]").should("have.attr", "data-intervalo", "60");

    const arrastar = () => {
      cy.contains("[data-cy=agendamento]", cliente)
        .should("have.attr", "data-movel", "sim")
        .then(($bloco) => {
          const b = $bloco[0].getBoundingClientRect();
          cy.get(`[data-profissional="${prof2}"][data-hora="10:00"]`).then(($slot) => {
            const s = $slot[0].getBoundingClientRect();
            cy.wrap($bloco).trigger("pointerdown", ponteiro(b.left + 20, b.top + 5));
            cy.get("[data-cy=agenda-grade]")
              .trigger("pointermove", ponteiro(b.left + 30, b.top + 15))
              .trigger("pointermove", ponteiro(s.left + 20, s.top + 5));
            // a sombra mostra o destino antes de soltar
            cy.get("[data-cy=agenda-sombra]")
              .should("be.visible")
              .and("contain", "10:00")
              .and("contain", prof2);
            cy.get("[data-cy=agenda-grade]").trigger("pointerup", ponteiro(s.left + 20, s.top + 5));
          });
        });
      cy.get("[data-cy=modal-mover-agendamento]").should("be.visible");
      cy.get("[data-cy=mover-pergunta]").should("contain", `Mover para 10:00 com ${prof2}?`);
    };

    // 1) backend recusa: mensagem aparece e o bloco fica onde estava
    cy.intercept("PUT", "/api/v1/agendamentos/*", {
      statusCode: 400,
      body: "O profissional já tem agendamento das 10:00 às 10:30 neste dia",
    }).as("moverRecusado");
    arrastar();
    cy.get("[data-cy=mover-confirmar]").click();
    cy.wait("@moverRecusado");
    cy.get("[data-cy=mover-erro]").should("contain", "já tem agendamento das 10:00");
    cy.get("[data-cy=mover-cancelar]").click();
    cy.contains("[data-cy=agendamento]", cliente)
      .should("have.attr", "data-inicio", "09:00")
      .parent()
      .should("have.attr", "data-profissional", prof1);

    // 2) backend aceita: o PUT leva o agendamento completo, com nova hora e profissional
    // Handler próprio: sem ele o stub 400 acima continuaria respondendo.
    cy.intercept("PUT", "/api/v1/agendamentos/*", (req) => req.continue()).as("mover");
    arrastar();
    cy.get("[data-cy=mover-confirmar]").click();
    cy.wait("@mover").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(request.body.horarioInicio).to.eq("10:00:00");
      expect(request.body.horarioFim, "mesma duração").to.eq("11:00:00");
      expect(request.body.idFuncionario).to.eq(ids!.f2);
      expect(request.body.idCliente, "envia o agendamento completo").to.be.a("number");
      expect(request.body.idServico).to.be.a("number");
      expect(response?.body.nomeFuncionario).to.eq(prof2);
      // limpa para a próxima execução
      cy.api("DELETE", `/agendamentos/${response?.body.id}`);
    });
    cy.contains("[data-cy=agendamento]", cliente)
      .should("have.attr", "data-inicio", "10:00")
      .parent()
      .should("have.attr", "data-profissional", prof2);
  });

  it("sem arrastar (teclado): o detalhe permite mudar horário e profissional", () => {
    cy.api<{ id: number }>("POST", "/agendamentos", {
      data: amanhaISO(),
      horarioInicio: "13:00:00",
      horarioFim: "13:30:00",
      status: "AGENDADO",
      idFuncionario: ids!.f1,
      idCliente: ids!.cliente,
      idServico: ids!.servico,
    }).then(({ body }) => {
      cy.reload();
      cy.wait(["@funcionarios", "@agendamentos"]);
      cy.get("[data-cy=filtro-area]").select(nomes.areaA);
      cy.get("[data-cy=agenda-proximo]").click();
      cy.get(`[data-cy=agendamento][data-id="${body.id}"]`)
        .scrollIntoView({ offset: { top: -150, left: 0 } })
        .focus();
      // O bloco é um <button>: no navegador, Enter nele dispara o clique (conferido à mão).
      // O type("{enter}") do Cypress não simula essa ação padrão, então clicamos no elemento focado.
      cy.focused().should("have.attr", "data-id", String(body.id)).click();
      cy.get("[data-cy=modal-detalhe-agendamento]").should("be.visible");
      cy.get("[data-cy=remarcar-abrir]").click();
      cy.get("[data-cy=remarcar-hora]").clear().type("14:00");
      cy.get("[data-cy=remarcar-profissional]").select(String(ids!.f2));
      cy.intercept("PUT", "/api/v1/agendamentos/*").as("remarcar");
      cy.get("[data-cy=remarcar-salvar]").click();
      cy.wait("@remarcar").then(({ request, response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(request.body.horarioInicio).to.eq("14:00:00");
        expect(request.body.horarioFim).to.eq("14:30:00");
        expect(request.body.idFuncionario).to.eq(ids!.f2);
      });
      cy.get(`[data-cy=agendamento][data-id="${body.id}"]`)
        .should("have.attr", "data-inicio", "14:00")
        .parent()
        .should("have.attr", "data-profissional", prof2);
      cy.api("DELETE", `/agendamentos/${body.id}`);
    });
  });
});
