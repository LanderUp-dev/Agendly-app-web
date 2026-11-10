// @requisito RE-15 RE-16 RO-29 RO-28
/**
 * Cargos da loja: cria, edita, duplica o COLABORADOR, usa o cargo na equipe e exclui.
 * O usuário de teste é GERENTE da loja (tem todas as permissões).
 */
import { gerarCelular, gerarCPF, nascimento, sufixo } from "../support/dados";

describe("Cargos: criar, editar, duplicar, usar na equipe e excluir", () => {
  const nome = `Recepção ${sufixo()}`;
  const novoNome = `${nome} manhã`;
  const idsCriados: number[] = [];

  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
  });

  after(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    idsCriados.forEach((id) => cy.api("DELETE", `/cargos/${id}`, undefined, false));
  });

  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "/api/v1/cargos").as("lista");
    cy.intercept("GET", "/api/v1/permissoes").as("catalogo");
  });

  it("lista os cargos padrão como só leitura e avisa quando as mudanças valem", () => {
    cy.visit("/cargos");
    cy.wait(["@lista", "@catalogo"]);
    cy.get("[data-cy=cargo-aviso-vigencia]").should(
      "contain",
      "As mudanças valem para cada pessoa no próximo acesso à loja.",
    );
    cy.get("[data-cy=cargo-linha][data-cargo=GERENTE]")
      .should("contain", "Padrão")
      .find("[data-cy=cargo-excluir]")
      .should("not.exist");
    cy.get("[data-cy=cargo-linha][data-cargo=GERENTE] [data-cy=cargo-ver]").click();
    cy.get("[data-cy=cargo-somente-leitura]").should("be.visible");
    cy.get("[data-cy=cargo-salvar]").should("not.exist");
    cy.get("[data-cy=cargo-permissao-CLIENTE_VER]").should("be.checked").and("be.disabled");
    cy.get("[data-cy=cargo-voltar]").click();
  });

  it("cria um cargo com permissões agrupadas e o edita", () => {
    cy.visit("/cargos");
    cy.wait(["@lista", "@catalogo"]);
    cy.get("[data-cy=cargo-novo]").click();
    cy.get("[data-cy=modal-cargo]").should("be.visible");

    // validação no formulário
    cy.get("[data-cy=cargo-salvar]").click();
    cy.get("[data-cy=cargo-erro]").should("contain", "Informe o nome do cargo.");

    cy.get("[data-cy=cargo-nome]").type(nome);
    cy.get("[data-cy=cargo-descricao]").type("Atende o balcão");
    cy.contains("[data-cy=cargo-grupo]", "Clientes").find("[data-cy=cargo-marcar-grupo]").check();
    cy.get("[data-cy=cargo-permissao-CLIENTE_EXCLUIR]").uncheck();
    cy.get("[data-cy=cargo-permissao-AGENDAMENTO_VER]").check();

    cy.intercept("POST", "/api/v1/cargos").as("criar");
    cy.get("[data-cy=cargo-salvar]").click();
    cy.wait("@criar").then(({ request, response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(request.body.permissoes).to.have.members([
        "CLIENTE_VER",
        "CLIENTE_EDITAR",
        "AGENDAMENTO_VER",
      ]);
      idsCriados.push(response?.body.id);
    });
    cy.wait("@lista");
    cy.contains("[data-cy=cargo-linha]", nome).should("contain", "Atende o balcão");

    // editar
    cy.contains("[data-cy=cargo-linha]", nome).find("[data-cy=cargo-editar]").click();
    cy.get("[data-cy=cargo-nome]").clear().type(novoNome);
    cy.get("[data-cy=cargo-permissao-CLIENTE_EDITAR]").uncheck();
    cy.intercept("PUT", "/api/v1/cargos/*").as("editar");
    cy.get("[data-cy=cargo-salvar]").click();
    cy.wait("@editar").its("response.statusCode").should("eq", 200);
    cy.wait("@lista");
    cy.contains("[data-cy=cargo-linha]", novoNome)
      .find("[data-cy=cargo-qtd-permissoes]")
      .should("contain", "2 de");
  });

  it("não aceita nome repetido nem nome de cargo padrão", () => {
    cy.visit("/cargos");
    cy.wait(["@lista", "@catalogo"]);
    cy.get("[data-cy=cargo-novo]").click();
    cy.get("[data-cy=cargo-nome]").type("gerente");
    cy.get("[data-cy=cargo-salvar]").click();
    cy.get("[data-cy=cargo-erro]").should("contain", "cargo padrão do sistema");
    cy.get("[data-cy=cargo-nome]").clear().type(novoNome.toUpperCase());
    cy.get("[data-cy=cargo-salvar]").click();
    cy.get("[data-cy=cargo-erro]").should("contain", "Já existe um cargo");
    cy.get("[data-cy=cargo-voltar]").click();
  });

  it("duplica o COLABORADOR como cópia editável", () => {
    cy.visit("/cargos");
    cy.wait(["@lista", "@catalogo"]);
    cy.intercept("POST", "/api/v1/cargos/*/duplicar").as("duplicar");
    cy.get("[data-cy=cargo-linha][data-cargo=COLABORADOR] [data-cy=cargo-duplicar]").click();
    cy.wait("@duplicar").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.nome).to.match(/^Cópia de COLABORADOR/);
      expect(response?.body.doSistema).to.eq(false);
      idsCriados.push(response?.body.id);
    });
    // abre já em edição
    cy.get("[data-cy=modal-cargo]").should("be.visible");
    cy.get("[data-cy=cargo-nome]")
      .invoke("val")
      .should("match", /^Cópia de COLABORADOR/);
    cy.get("[data-cy=cargo-voltar]").click();
  });

  it("usa o cargo novo na equipe", () => {
    const email = `cargo.${sufixo()}@e2e.test`;
    cy.request("POST", "/api/v1/usuarios", {
      nome: "Pessoa",
      sobrenome: "Cargo",
      email,
      celular: gerarCelular(),
      cpf: gerarCPF(),
      dtaNascimento: nascimento(25),
      senha: `Cargo#${sufixo()}`,
    });
    cy.visit("/cadastro-equipe");
    cy.wait("@lista");
    cy.get("[data-cy=form-email-usuario]").type(email);
    cy.get("[data-cy=form-cargo]").select(novoNome);
    cy.intercept("POST", "/api/v1/equipes").as("adicionar");
    cy.get("[data-cy=form-salvar]").click();
    cy.wait("@adicionar").then(({ response }) => {
      expect(response?.statusCode).to.eq(201);
      expect(response?.body.nomeCargo).to.eq(novoNome);
      const idEquipe = response?.body.id as string;

      // em uso: não exclui
      cy.visit("/cargos");
      cy.wait("@lista");
      cy.contains("[data-cy=cargo-linha]", novoNome)
        .find("[data-cy=cargo-pessoas]")
        .should("contain", "1");
      cy.contains("[data-cy=cargo-linha]", novoNome).find("[data-cy=cargo-excluir]").click();
      cy.contains("Mude o cargo delas").should("be.visible");

      // volta a pessoa para COLABORADOR pela listagem de equipes e remove da loja
      cy.visit("/listagem-equipes");
      cy.contains("[data-cy=tabela] tbody tr", "Pessoa")
        .find("[data-cy=equipe-mudar-cargo]")
        .click();
      cy.get("[data-cy=equipe-cargo-select]").select("COLABORADOR (padrão)");
      cy.intercept("PUT", "/api/v1/equipes/*").as("mudar");
      cy.get("[data-cy=equipe-cargo-salvar]").click();
      cy.wait("@mudar").its("response.body.nomeCargo").should("eq", "COLABORADOR");
      cy.api("DELETE", `/equipes/${idEquipe}`, undefined, false);
    });
  });

  it("exclui o cargo com confirmação", () => {
    cy.visit("/cargos");
    cy.wait(["@lista", "@catalogo"]);
    cy.on("window:confirm", () => true);
    cy.intercept("DELETE", "/api/v1/cargos/*").as("excluir");
    cy.contains("[data-cy=cargo-linha]", novoNome).find("[data-cy=cargo-excluir]").click();
    cy.wait("@excluir").its("response.statusCode").should("eq", 204);
    cy.wait("@lista");
    cy.contains("[data-cy=cargo-linha]", novoNome).should("not.exist");
  });
});
