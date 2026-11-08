// @requisito RO-30 RO-31 RO-32 RO-37 RO-39 RNR-19 RND-06 RU-02
import { hojeBR, hojeISO, sufixo } from "../support/dados";

describe("Agenda", () => {
  const nomeFunc = `Prof${sufixo().replace(/\d/g, "")}`;
  const nomeCliente = `Cli${sufixo().replace(/\d/g, "")}`;

  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    cy.lojaDeTeste().then((loja) => {
      cy.criarArea(loja.id).then((area) => {
        cy.criarServico(loja.id, area.id, "Corte Agenda").then((servico) => {
          cy.criarFuncionario(loja.id, nomeFunc).then((func) => {
            cy.criarCliente(loja.id, nomeCliente).then((cliente) => {
              cy.api("POST", "/agendamentos", {
                data: hojeISO(),
                horarioInicio: "09:00:00",
                horarioFim: "10:30:00",
                status: "AGENDADO",
                idLoja: loja.id,
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

  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "/api/v1/funcionarios").as("funcionarios");
    cy.intercept("GET", "/api/v1/agendamentos").as("agendamentos");
    cy.visit("/agenda");
    cy.wait(["@funcionarios", "@agendamentos"]);
  });

  it("mostra a grade com funcionários (colunas) e horários (linhas)", () => {
    cy.get("[data-cy=agenda-grade]").should("be.visible");
    cy.get("[data-cy=agenda-coluna]").should("contain", nomeFunc);
    cy.get("[data-cy=agenda-hora]").should("contain", "09:00").and("contain", "23:00");
  });

  it("agendamento aparece na data certa (dd/MM/yyyy) e no horário HH:mm", () => {
    cy.contains("[data-cy=agendamento]", nomeCliente)
      .should("have.attr", "data-data", hojeBR())
      .and("have.attr", "data-inicio", "09:00")
      .and("have.attr", "data-fim", "10:30")
      .and("contain", "09:00–10:30")
      .and("contain", "Corte Agenda");
    cy.get("[data-cy=agenda-legenda]").should("contain", "Corte Agenda");
  });

  it("agendamento some ao mudar para outro dia", () => {
    cy.contains("[data-cy=agendamento]", nomeCliente).should("exist");
    cy.get("[data-cy=agenda-proximo]").click();
    cy.contains("[data-cy=agendamento]", nomeCliente).should("not.exist");
    cy.get("[data-cy=agenda-hoje]").click();
    cy.contains("[data-cy=agendamento]", nomeCliente).should("exist");
  });

  it("troca a granularidade 15 / 30 / 60 minutos", () => {
    const linhas = (n: number) => cy.get("[data-cy=agenda-hora]").should("have.length", n);
    cy.get("[data-cy=agenda-grade]").should("have.attr", "data-intervalo", "60");
    linhas(24);
    cy.get("[data-cy=intervalo-30]").check({ force: true });
    cy.get("[data-cy=agenda-grade]").should("have.attr", "data-intervalo", "30");
    linhas(48);
    cy.get("[data-cy=intervalo-15]").check({ force: true });
    cy.get("[data-cy=agenda-grade]").should("have.attr", "data-intervalo", "15");
    linhas(96);
    cy.contains("[data-cy=agendamento]", nomeCliente).should("exist");
  });

  it("filtro de profissionais esconde a coluna", () => {
    cy.contains("[data-cy=agenda-coluna]", nomeFunc).should("exist");
    cy.contains("label", nomeFunc).find("input").uncheck();
    // Com a agenda isolada por loja, pode não sobrar nenhuma coluna: basta não haver a deste profissional.
    cy.contains("[data-cy=agenda-coluna]", nomeFunc).should("not.exist");
  });

  it("teclado: Enter num horário abre o modal; Esc fecha e devolve o foco", () => {
    cy.get(`[aria-label^="11:00 com ${nomeFunc}"]`).focus().type("{enter}");
    cy.get("[data-cy=modal-agendamento]").should("be.visible");
    // O campo guarda o id; o texto da opção escolhida é o nome do profissional da coluna.
    cy.get("#ag-profissional").find("option:selected").should("contain.text", nomeFunc);
    cy.get("body").type("{esc}");
    cy.get("[data-cy=modal-agendamento]").should("not.exist");
    cy.focused()
      .should("have.attr", "aria-label")
      .and("match", new RegExp(`^11:00 com ${nomeFunc}`));
  });

  it("detalhes do agendamento: link de confirmação pelo WhatsApp com a mensagem pronta", () => {
    // center: no topo o cabeçalho fixo dos profissionais cobre o agendamento
    cy.contains("[data-cy=agendamento]", nomeCliente).click({ scrollBehavior: "center" });
    cy.get("[data-cy=modal-detalhe-agendamento]").should("be.visible");
    cy.get("[data-cy=detalhe-status]").should("contain", "Aguardando confirmação");
    cy.get("[data-cy=enviar-whatsapp]")
      .should("have.attr", "target", "_blank")
      .and("have.attr", "href")
      .then((href) => {
        const url = new URL(String(href));
        expect(url.host).to.eq("wa.me");
        expect(url.pathname, "celular com DDI 55").to.match(/^\/55\d{10,11}$/);
        const texto = url.searchParams.get("text") ?? "";
        expect(texto).to.contain("Corte Agenda").and.contain(nomeFunc).and.contain("09:00");
        expect(texto).to.contain("Responda *SIM*");
      });
  });

  it("marca como confirmado, cancela e reativa (status no backend)", () => {
    cy.intercept("PATCH", "/api/v1/agendamentos/*/status").as("status");
    // center: no topo o cabeçalho fixo dos profissionais cobre o agendamento
    cy.contains("[data-cy=agendamento]", nomeCliente).click({ scrollBehavior: "center" });
    cy.get("[data-cy=marcar-confirmado]").click();
    cy.wait("@status").its("response.body.status").should("eq", "CONFIRMADO");
    cy.contains("[data-cy=agendamento]", nomeCliente).should(
      "have.attr",
      "data-status",
      "CONFIRMADO",
    );

    // center: no topo o cabeçalho fixo dos profissionais cobre o agendamento
    cy.contains("[data-cy=agendamento]", nomeCliente).click({ scrollBehavior: "center" });
    cy.get("[data-cy=marcar-confirmado]").should("not.exist");
    cy.on("window:confirm", () => true);
    cy.get("[data-cy=marcar-cancelado]").click();
    cy.wait("@status").its("response.body.status").should("eq", "CANCELADO");
    cy.contains("[data-cy=agendamento]", nomeCliente).should(
      "have.attr",
      "data-status",
      "CANCELADO",
    );

    // center: no topo o cabeçalho fixo dos profissionais cobre o agendamento
    cy.contains("[data-cy=agendamento]", nomeCliente).click({ scrollBehavior: "center" });
    cy.get("[data-cy=reativar]").click();
    cy.wait("@status").its("response.body.status").should("eq", "AGENDADO");
  });

  it("cria agendamento pelo modal com horário livre e bloqueia conflito (motor de horários)", () => {
    // Amanhã, para os horários não terem passado
    cy.get("[data-cy=agenda-proximo]").click();
    cy.get(`[aria-label^="15:00 com ${nomeFunc}"]`).click({ scrollBehavior: "center" });
    cy.get("[data-cy=modal-agendamento]").should("be.visible");
    cy.get("#ag-cliente").select(nomeCliente);
    cy.get("#ag-servico")
      .find("option")
      .contains("Corte Agenda")
      .then((o) => {
        cy.get("#ag-servico").select(String(o.val()));
      });
    cy.intercept("GET", "/api/v1/disponibilidade*").as("livres");
    cy.wait("@livres").its("response.statusCode").should("eq", 200);
    cy.get("[data-cy=ag-hora]").should("have.value", "15:00"); // a hora clicada está livre
    cy.intercept("POST", "/api/v1/agendamentos").as("criar");
    cy.get("[data-cy=salvar-agendamento]").click();
    cy.wait("@criar").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.horarioFim, "fim pela duração do serviço (30 min padrão)").to.eq(
        "15:30:00",
      );
      const corpo = response?.body;
      // Mesmo profissional, horário sobreposto: o backend recusa
      cy.api(
        "POST",
        "/agendamentos",
        {
          data: corpo.data,
          horarioInicio: "15:15:00",
          idFuncionario: corpo.idFuncionario,
          idServico: corpo.idServico,
          idCliente: corpo.idCliente,
        },
        false,
      ).then((r) => {
        expect(r.status).to.eq(400);
        expect(r.body).to.contain("já tem agendamento das 15:00 às 15:30");
      });
      // remove (não cancela): cancelado continua desenhado no horário e travaria a próxima execução
      cy.api("DELETE", `/agendamentos/${corpo.id}`);
    });
    cy.contains("[data-cy=agendamento]", nomeCliente).should("exist");
  });
});
