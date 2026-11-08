// @requisito RE-01 RO-16
import { gerarCPF, gerarCelular, nascimento, sufixo } from "../support/dados";

interface Conta {
  nome: string;
  sobrenome: string;
  email: string;
  celular: string;
  cpf: string;
  dtaNascimento: string;
  senha: string;
  confirmarSenha: string;
}

const contaValida = (): Conta => {
  const s = sufixo();
  return {
    nome: "Maria",
    sobrenome: "Teste",
    email: `conta.${s}@e2e.test`,
    celular: gerarCelular(),
    cpf: gerarCPF(),
    dtaNascimento: nascimento(25),
    senha: "Agendly2026",
    confirmarSenha: "Agendly2026",
  };
};

function preencher(c: Partial<Conta>, aceitar = true) {
  if (c.nome) cy.get("[data-cy=cadastro-nome]").type(c.nome);
  if (c.sobrenome) cy.get("[data-cy=cadastro-sobrenome]").type(c.sobrenome);
  if (c.dtaNascimento) cy.get("[data-cy=cadastro-nascimento]").type(c.dtaNascimento);
  if (c.cpf) cy.get("[data-cy=cadastro-cpf]").type(c.cpf);
  if (c.email) cy.get("[data-cy=cadastro-email]").type(c.email);
  if (c.celular) cy.get("[data-cy=cadastro-celular]").type(c.celular);
  if (c.senha) cy.get("[data-cy=cadastro-senha]").type(c.senha, { log: false });
  if (c.confirmarSenha)
    cy.get("[data-cy=cadastro-confirmar-senha]").type(c.confirmarSenha, { log: false });
  if (aceitar) {
    cy.get("[data-cy=cadastro-termos]").check();
    cy.get("[data-cy=cadastro-privacidade]").check();
  }
}

const erroDoCampo = (id: string) => cy.get(`#${id}-erro`);

describe("Cadastro de conta", () => {
  beforeEach(() => {
    cy.clearAllLocalStorage();
    cy.visit("/register");
    cy.get("[data-cy=cadastro-form][data-hidratado=true]");
  });

  it("botão fica desabilitado sem aceitar termos e política", () => {
    preencher(contaValida(), false);
    cy.get("[data-cy=cadastro-enviar]").should("be.disabled");
    cy.get("[data-cy=cadastro-termos]").check();
    cy.get("[data-cy=cadastro-enviar]").should("be.disabled");
    cy.get("[data-cy=cadastro-privacidade]").check();
    cy.get("[data-cy=cadastro-enviar]").should("be.enabled");
  });

  it("campos obrigatórios: sem nome mostra erro junto ao campo", () => {
    const c = contaValida();
    preencher({ ...c, nome: "" });
    cy.intercept("POST", "/api/v1/usuarios").as("cadastro");
    cy.get("[data-cy=cadastro-enviar]").click();
    erroDoCampo("campo-nome").should("contain", "Informe nome e sobrenome.");
    cy.focused().should("have.attr", "id", "campo-nome");
    cy.get("#campo-nome").should("have.attr", "aria-invalid", "true");
  });

  it("CPF inválido é barrado no front", () => {
    preencher({ ...contaValida(), cpf: "12345678901" });
    cy.get("[data-cy=cadastro-enviar]").click();
    erroDoCampo("campo-cpf").should("contain", "CPF inválido.");
  });

  it("celular inválido é barrado no front", () => {
    preencher({ ...contaValida(), celular: "3233334444" });
    cy.get("[data-cy=cadastro-enviar]").click();
    erroDoCampo("campo-celular").should("contain", "11 dígitos");
  });

  it("menor de 18 anos não pode criar conta", () => {
    preencher({ ...contaValida(), dtaNascimento: nascimento(16) });
    cy.get("[data-cy=cadastro-enviar]").click();
    erroDoCampo("campo-dtaNascimento").should("contain", "entre 18 e 99 anos");
  });

  it("senhas diferentes são barradas", () => {
    preencher({ ...contaValida(), confirmarSenha: "OutraSenha99" });
    cy.get("#campo-confirmarSenha-erro").should("be.visible");
    cy.get("[data-cy=cadastro-enviar]").click();
    erroDoCampo("campo-confirmarSenha").should("contain", "As senhas não coincidem");
  });

  it("sucesso: envia só dígitos, mostra toast e leva ao login", () => {
    const c = contaValida();
    cy.intercept("POST", "/api/v1/usuarios").as("cadastro");
    preencher(c);
    cy.get("[data-cy=cadastro-enviar]").click();
    cy.wait("@cadastro").then(({ request, response }) => {
      expect(request.body).to.deep.include({
        nome: c.nome,
        sobrenome: c.sobrenome,
        email: c.email,
        celular: c.celular,
        cpf: c.cpf,
        dtaNascimento: c.dtaNascimento,
      });
      expect(request.body).to.not.have.property("dataNascimento");
      expect(request.body).to.not.have.property("confirmarSenha");
      expect(request.body.cpf).to.match(/^\d{11}$/);
      expect(request.body.celular).to.match(/^\d{11}$/);
      expect(response?.statusCode).to.eq(201);
    });
    cy.contains("[data-sonner-toast]", "Conta criada com sucesso").should("be.visible");
    cy.location("pathname").should("eq", "/login");
  });

  it("e-mail duplicado mostra mensagem clara (sem SQL do backend)", () => {
    const c = contaValida();
    cy.request("POST", "/api/v1/usuarios", {
      nome: c.nome,
      sobrenome: c.sobrenome,
      email: c.email,
      celular: c.celular,
      cpf: c.cpf,
      dtaNascimento: c.dtaNascimento,
      senha: c.senha,
    });
    cy.intercept("POST", "/api/v1/usuarios").as("cadastro");
    preencher({ ...c, cpf: gerarCPF() });
    cy.get("[data-cy=cadastro-enviar]").click();
    cy.wait("@cadastro").its("response.statusCode").should("eq", 400);
    // RNR-01: o backend responde com a regra (não mais com o erro do banco).
    cy.contains("[data-sonner-toast]", "Este e-mail já está cadastrado").should("be.visible");
    cy.get("body").should("not.contain", "insert into").and("not.contain", "constraint");
    cy.location("pathname").should("eq", "/register");
  });
});
