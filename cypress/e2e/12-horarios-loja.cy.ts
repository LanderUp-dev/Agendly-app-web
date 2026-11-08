// @requisito RO-38 RNR-21
/**
 * Motor de horários: horário de funcionamento da loja.
 * Configura, confere que a agenda respeita e, no fim, volta a "sem restrição"
 * (as outras specs agendam em qualquer dia/horário).
 */
describe("Horários da loja", () => {
  beforeEach(() => cy.login());
  after(() => {
    cy.login();
    cy.visit("/agenda");
    cy.api("PUT", "/horarios-funcionamento", []);
  });

  it("configura segunda a sexta com intervalo e mostra fechado no fim de semana", () => {
    cy.visit("/agenda");
    cy.get("[data-cy=menu-navegacao]").click();
    cy.get("[data-cy=menu-horarios]").click();
    cy.location("pathname").should("eq", "/horarios-loja");

    for (let d = 1; d <= 5; d++) {
      cy.get(`[data-cy=aberto-${d}]`).check();
    }
    cy.get("[data-cy=intervalo-1]").check();
    cy.get("[data-cy=dia-6]").should("contain", "Fechado");
    cy.intercept("PUT", "/api/v1/horarios-funcionamento").as("salvar");
    cy.get("[data-cy=salvar-horarios]").click();
    cy.wait("@salvar").then(({ response }) => {
      expect(response?.statusCode).to.eq(200);
      expect(response?.body).to.have.length(5);
      expect(response?.body[0].intervaloInicio).to.eq("12:00:00");
    });
    cy.reload();
    cy.get("[data-cy=aberto-1]").should("be.checked");
    cy.get("[data-cy=aberto-7]").should("not.be.checked");
  });

  it("horário inválido mostra a mensagem do backend", () => {
    cy.visit("/horarios-loja");
    cy.get("[data-cy=aberto-2]").check();
    cy.get("[data-cy=abertura-2]").clear().type("19:00");
    cy.get("[data-cy=salvar-horarios]").click();
    cy.contains("A abertura deve ser antes do fechamento").should("exist");
  });

  it("agenda recusa horário fora do expediente", () => {
    cy.visit("/agenda");
    cy.api("PUT", "/horarios-funcionamento", [
      { diaSemana: 1, abertura: "09:00", fechamento: "18:00" },
    ]);
    // Próxima segunda daqui a 2 semanas
    const d = new Date();
    d.setDate(d.getDate() + 14 + ((8 - d.getDay()) % 7));
    const data = d.toLocaleDateString("sv-SE");
    cy.api<{ id: number }[]>("GET", "/funcionarios").then(({ body: funcs }) => {
      cy.api<{ id: number }[]>("GET", "/servicos").then(({ body: servs }) => {
        cy.api<{ id: number }[]>("GET", "/clientes").then(({ body: clis }) => {
          cy.api(
            "POST",
            "/agendamentos",
            {
              data,
              horarioInicio: "07:00:00",
              idFuncionario: funcs[0].id,
              idServico: servs[0].id,
              idCliente: clis[0].id,
            },
            false,
          ).then((r) => {
            expect(r.status).to.eq(400);
            expect(r.body).to.contain("Fora do horário de funcionamento (09:00–18:00)");
          });
        });
      });
    });
  });
});
