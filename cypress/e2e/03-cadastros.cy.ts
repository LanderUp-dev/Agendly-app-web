// @requisito RE-03 RE-04 RE-05 RE-11 RE-12 RO-28
import { gerarCNPJ, gerarCPF, gerarCelular, nascimento, sufixo } from "../support/dados";

/**
 * Cadastros: validação no front, payload só com dígitos (cy.intercept),
 * sucesso com toast + redirecionamento e erro 400 do backend exibido.
 * Dados com sufixo único. Não há endpoint de limpeza em lote: ver relatório.
 */

// "exist" e não "be.visible": numa loja nova o toast "Próximo passo" empilha por cima
// do de sucesso, e o sonner recolhe o de baixo (fica no DOM, mas não "visível").
const toast = (texto: string) =>
  cy.contains("[data-sonner-toast]", texto, { timeout: 10000 }).should("exist");

describe("Cadastros", () => {
  let loja: { id: number; nome: string };
  let area: { id: number; nome: string };

  before(() => {
    cy.login();
    cy.visit("/listagem-lojas");
    cy.lojaDeTeste().then((l) => {
      loja = l;
      cy.criarArea(l.id).then((a) => (area = a));
    });
  });

  beforeEach(() => cy.login());

  // ------------------------------------------------------------------ Loja
  describe("Loja", () => {
    it("valida CNPJ no front", () => {
      cy.visit("/cadastro-loja");
      cy.get("[data-cy=form-nome]").type("Loja inválida");
      cy.get("[data-cy=form-cnpj]").type("11222333000180");
      cy.get("[data-cy=form-salvar]").click();
      cy.get("#campo-cnpj-erro").should("contain", "CNPJ inválido.");
    });

    it("envia só dígitos e redireciona para a listagem", () => {
      const s = sufixo();
      const cnpj = gerarCNPJ();
      const cel = gerarCelular();
      cy.intercept("POST", "/api/v1/lojas").as("criar");
      cy.visit("/cadastro-loja");
      cy.get("[data-cy=form-nome]").type(`Loja UI ${s}`);
      cy.get("[data-cy=form-cnpj]").type(cnpj);
      cy.get("[data-cy=form-email]").type(`loja.ui.${s}@e2e.test`);
      cy.get("[data-cy=form-celular]").type(cel);
      cy.get("[data-cy=form-cep]").type("36010000");
      cy.get("[data-cy=form-logradouro]").type("Rua Halfeld");
      cy.get("[data-cy=form-numero]").type("500");
      cy.get("[data-cy=form-bairro]").type("Centro");
      cy.get("[data-cy=form-cidade]").type("Juiz de Fora");
      cy.get("[data-cy=form-estado]").select("MG");
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").then(({ request, response }) => {
        expect(request.body.cnpj).to.eq(cnpj);
        expect(request.body.celular).to.eq(cel);
        expect(request.body.cep).to.eq("36010000");
        expect(response?.statusCode).to.eq(201);
      });
      toast("Loja cadastrada com sucesso");
      cy.location("pathname").should("eq", "/listagem-lojas");
      cy.get("[data-cy=busca]").type(`Loja UI ${s}`);
      cy.get("[data-cy=tabela]").should("contain", `Loja UI ${s}`);
    });

    it("erro 400 do backend aparece para o usuário", () => {
      cy.intercept("POST", "/api/v1/lojas", { statusCode: 400, body: "Cnpj não Preenchido" }).as(
        "criar",
      );
      cy.visit("/cadastro-loja");
      cy.get("[data-cy=form-nome]").type("Loja 400");
      cy.get("[data-cy=form-cnpj]").type(gerarCNPJ());
      cy.get("[data-cy=form-email]").type("loja400@e2e.test");
      cy.get("[data-cy=form-celular]").type(gerarCelular());
      cy.get("[data-cy=form-cep]").type("36010000");
      cy.get("[data-cy=form-logradouro]").type("Rua A");
      cy.get("[data-cy=form-numero]").type("1");
      cy.get("[data-cy=form-bairro]").type("Centro");
      cy.get("[data-cy=form-cidade]").type("Juiz de Fora");
      cy.get("[data-cy=form-estado]").select("MG");
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar");
      toast("Cnpj não Preenchido");
      cy.location("pathname").should("eq", "/cadastro-loja");
    });
  });

  // ------------------------------------------------------- Área de atuação
  describe("Área de atuação", () => {
    it("mostra a loja ativa, só leitura", () => {
      cy.visit("/cadastro-area-atuacao");
      cy.get("[data-cy=form-loja-ativa]")
        .should("have.value", loja.nome)
        .and("have.attr", "readonly");
    });

    it("cria e redireciona", () => {
      const nome = `Área UI ${sufixo()}`;
      cy.intercept("POST", "/api/v1/AreasAtuacoes").as("criar");
      cy.visit("/cadastro-area-atuacao");
      cy.get("[data-cy=form-nome]").type(nome);
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").then(({ request, response }) => {
        expect(request.body, "sem idLoja no body").not.to.have.property("idLoja");
        expect(response?.statusCode).to.eq(201);
      });
      toast("Área de atuação cadastrada com sucesso");
      cy.location("pathname").should("eq", "/listagem-areas-atuacao");
    });
  });

  // --------------------------------------------------------------- Serviço
  describe("Serviço", () => {
    it("valida comissão (0 a 100)", () => {
      cy.visit("/cadastro-servico");
      cy.get("[data-cy=form-nome]").type("Serviço sem comissão");
      cy.get("[data-cy=form-preco]").type("50");
      cy.get("[data-cy=form-salvar]").click();
      cy.get("#campo-comissaoLoja-erro").should("contain", "entre 0 e 100");
    });

    it("converte preço com vírgula e envia ids numéricos", () => {
      const nome = `Corte ${sufixo()}`;
      cy.intercept("POST", "/api/v1/servicos").as("criar");
      cy.visit("/cadastro-servico");
      cy.get("[data-cy=form-nome]").type(nome);
      cy.get("[data-cy=form-preco]").type("79,90");
      cy.get("[data-cy=form-comissao]").type("30");
      cy.get("[data-cy=form-area]").should("not.be.disabled").select(String(area.id));
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").then(({ request, response }) => {
        expect(request.body.preco).to.eq(79.9);
        expect(request.body.comissaoLoja).to.eq(30);
        expect(request.body, "sem idLoja no body").not.to.have.property("idLoja");
        expect(request.body.idArea).to.be.a("number");
        expect(response?.statusCode).to.eq(201);
      });
      toast("Serviço cadastrado com sucesso");
      cy.location("pathname").should("eq", "/listagem-servicos");
    });
  });

  // ----------------------------------------------------------- Funcionário
  describe("Funcionário", () => {
    it("valida CPF no front", () => {
      cy.visit("/cadastro-funcionario");
      cy.get("[data-cy=form-nome]").type("Ana");
      cy.get("[data-cy=form-cpf]").type("11111111111");
      cy.get("[data-cy=form-salvar]").click();
      cy.get("#campo-cpf-erro").should("contain", "CPF inválido.");
    });

    it("envia só dígitos e redireciona", () => {
      const cpf = gerarCPF();
      const cel = gerarCelular();
      cy.intercept("POST", "/api/v1/funcionarios").as("criar");
      cy.visit("/cadastro-funcionario");
      cy.get("[data-cy=form-nome]").type("Ana");
      cy.get("[data-cy=form-sobrenome]").type(`Lima ${sufixo().replace(/\d/g, "")}`);
      cy.get("[data-cy=form-cpf]").type(cpf);
      cy.get("[data-cy=form-nascimento]").type(nascimento(30));
      cy.get("[data-cy=form-email]").type(`ana.${sufixo()}@e2e.test`);
      cy.get("[data-cy=form-celular]").type(cel);
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").then(({ request, response }) => {
        expect(request.body.cpf).to.eq(cpf);
        expect(request.body.celular).to.eq(cel);
        expect(request.body.dtaNascimento).to.match(/^\d{4}-\d{2}-\d{2}$/);
        expect(response?.statusCode).to.eq(201);
      });
      toast("Funcionário cadastrado com sucesso");
      cy.location("pathname").should("eq", "/listagem-funcionarios");
    });
  });

  // --------------------------------------------------------------- Cliente
  describe("Cliente", () => {
    it("valida e-mail no front", () => {
      cy.visit("/cadastro-cliente");
      cy.get("[data-cy=form-nome]").type("Carla");
      cy.get("[data-cy=form-cpf]").type(gerarCPF());
      cy.get("[data-cy=form-email]").type("email-invalido");
      cy.get("[data-cy=form-salvar]").click();
      cy.get("#campo-email-erro").should("contain", "e-mail válido");
    });

    it("envia sobreNome (DTO) e o sobrenome aparece na listagem", () => {
      const sobrenome = `Souza${sufixo().replace(/\d/g, "")}`;
      const cpf = gerarCPF();
      cy.intercept("POST", "/api/v1/clientes").as("criar");
      cy.visit("/cadastro-cliente");
      cy.get("[data-cy=form-nome]").type("Carla");
      cy.get("[data-cy=form-sobrenome]").type(sobrenome);
      cy.get("[data-cy=form-cpf]").type(cpf);
      cy.get("[data-cy=form-nascimento]").type(nascimento(40));
      cy.get("[data-cy=form-email]").type(`carla.${sufixo()}@e2e.test`);
      cy.get("[data-cy=form-celular]").type(gerarCelular());
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").then(({ request, response }) => {
        expect(request.body.sobreNome).to.eq(sobrenome);
        expect(request.body.cpf).to.eq(cpf);
        expect(response?.statusCode).to.eq(201);
      });
      toast("Cliente cadastrado com sucesso");
      cy.location("pathname").should("eq", "/listagem-clientes");
      // Depende do backend copiar ClienteDTO.sobreNome -> Cliente.sobrenome
      cy.get("[data-cy=busca]").type(cpf);
      cy.get("[data-cy=tabela]").should("contain", `Carla ${sobrenome}`);
    });
  });

  // ----------------------------------------------------------- Cobrancista
  describe("Cobrancista", () => {
    it("telefone fixo opcional é validado quando informado", () => {
      cy.visit("/cadastro-cobrancista");
      cy.get("[data-cy=form-nome]").type("Paula");
      cy.get("[data-cy=form-email]").type("paula@e2e.test");
      cy.get("[data-cy=form-celular]").type(gerarCelular());
      cy.get("[data-cy=form-telefone]").type("3299");
      cy.get("[data-cy=form-salvar]").click();
      cy.get("#campo-telefone-erro").should("contain", "Telefone fixo inválido");
    });

    it("cria com telefone só com dígitos", () => {
      const cel = gerarCelular();
      cy.intercept("POST", "/api/v1/cobrancistas").as("criar");
      cy.visit("/cadastro-cobrancista");
      cy.get("[data-cy=form-nome]").type("Paula Costa");
      cy.get("[data-cy=form-email]").type(`paula.${sufixo()}@e2e.test`);
      cy.get("[data-cy=form-celular]").type(cel);
      cy.get("[data-cy=form-telefone]").type("3232151234");
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").then(({ request, response }) => {
        expect(request.body.celular).to.eq(cel);
        expect(request.body.telefone).to.eq("3232151234");
        expect(response?.statusCode).to.eq(201);
      });
      toast("Cobrancista cadastrado com sucesso");
      cy.location("pathname").should("eq", "/listagem-cobrancistas");
    });
  });

  // ---------------------------------------------------------------- Equipe
  describe("Equipe", () => {
    it("exige o e-mail da conta", () => {
      cy.visit("/cadastro-equipe");
      cy.get("[data-cy=form-salvar]").click();
      cy.get("#campo-emailUsuario-erro").should("contain", "Informe o e-mail da conta do usuário.");
    });

    it("e-mail sem conta mostra o erro do backend", () => {
      cy.intercept("POST", "/api/v1/equipes").as("criar");
      cy.visit("/cadastro-equipe");
      cy.get("[data-cy=form-email-usuario]").type(`ninguem.${sufixo()}@e2e.test`);
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").its("response.statusCode").should("eq", 400);
      toast("Nenhuma conta cadastrada com este e-mail");
    });

    it("adiciona uma conta à loja ativa pelo e-mail", () => {
      // A conta precisa existir: cria pela rota pública de cadastro.
      const email = `membro.${sufixo()}@e2e.test`;
      cy.request("POST", "/api/v1/usuarios", {
        nome: "Membro",
        sobrenome: "E2E",
        email,
        celular: gerarCelular(),
        cpf: gerarCPF(),
        dtaNascimento: nascimento(25),
        senha: `Membro#${sufixo()}`,
      });
      cy.intercept("POST", "/api/v1/equipes").as("criar");
      cy.visit("/cadastro-equipe");
      cy.get("[data-cy=form-email-usuario]").type(email);
      cy.get("[data-cy=form-salvar]").click();
      cy.wait("@criar").then(({ request, response }) => {
        expect(request.body).to.deep.eq({ emailUsuario: email });
        expect(response?.statusCode, "status do POST /equipes").to.eq(201);
        expect(response?.body.idLoja, "vínculo na loja ativa").to.eq(loja.id);
        expect(response?.body.nomeCargo).to.eq("COLABORADOR");
      });
      toast("Usuário adicionado à equipe da loja");
      cy.location("pathname").should("eq", "/listagem-equipes");
      cy.contains("[data-cy=tabela] tbody tr", "Membro").should("contain", "COLABORADOR");
    });
  });

  // ------------------------------------------- Área x Funcionário (pendente)
  describe("Área x Funcionário", () => {
    it("não finge sucesso: botão desabilitado e aviso visível", () => {
      cy.visit("/cadastro-area-funcionario");
      cy.get("[data-cy=aviso-indisponivel]").should("be.visible");
      cy.get("[data-cy=form-salvar]").should("be.disabled");
    });

    it.skip("PENDENTE (backend): criar vínculo Área x Funcionário — não há endpoint", () => {});
  });
});
