// @requisito RE-12 RO-25
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { concluirCadastro } from "@/lib/fluxoCadastro";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { clientesService } from "@/services/endpoints";
import { somenteDigitos, validarCPF, validarCelular, validarEmail } from "@/lib/validators";
import { Button, ButtonLink, Card, FormField, PageHeader, LojaDoCadastro } from "@/components/ds";
import { useErrosFormulario } from "@/hooks/useErrosFormulario";

export default function CadastroCliente() {
  const [formData, setFormData] = useState({
    nome: "",
    sobreNome: "",
    cpf: "",
    email: "",
    celular: "",
    dtaNascimento: "",
  });
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const { erros, falhar, limpar } = useErrosFormulario();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    let { value } = e.target;

    // Filtros de máscara e validação
    if (name === "nome" || name === "sobreNome") {
      value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
    } else if (name === "celular") {
      value = value.replace(/\D/g, "");
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
      }
    } else if (name === "cpf") {
      value = value.replace(/\D/g, "");
      if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    limpar(name);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;

    // ClienteDTO usa `sobreNome` (com N maiúsculo).
    const payload = {
      nome: formData.nome.trim(),
      sobreNome: formData.sobreNome.trim(),
      cpf: somenteDigitos(formData.cpf),
      email: formData.email.trim(),
      celular: somenteDigitos(formData.celular),
      dtaNascimento: formData.dtaNascimento || null,
    };

    if (!payload.nome) return falhar("nome", "Informe o nome do cliente.");
    if (!validarCPF(payload.cpf)) return falhar("cpf", "CPF inválido.");
    if (!validarEmail(payload.email)) return falhar("email", "Informe um e-mail válido.");
    if (!validarCelular(payload.celular))
      return falhar("celular", "Informe um celular válido com DDD.");

    setSalvando(true);
    try {
      const criado = await clientesService.criar(payload);
      toast.success("Cliente cadastrado com sucesso!");
      concluirCadastro({ navigate, listagem: "/listagem-clientes", criado, etapa: "cliente" });
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Novo cliente"
        descricao="Dados pessoais e a loja onde costuma ser atendido."
        voltar={{ to: "/listagem-clientes", rotulo: "Clientes" }}
      />
      <Card como="section" className="form-card">
        <form onSubmit={handleSalvar} noValidate data-cy="form-cliente">
          <div className="form-grade">
            <FormField id="campo-nome" label="Nome" obrigatorio colunas={6} erro={erros.nome}>
              <input
                type="text"
                name="nome"
                autoComplete="off"
                value={formData.nome}
                onChange={handleChange}
                data-cy="form-nome"
              />
            </FormField>
            <FormField
              id="campo-sobreNome"
              label="Sobrenome"
              obrigatorio
              colunas={6}
              erro={erros.sobreNome}
            >
              <input
                type="text"
                name="sobreNome"
                autoComplete="off"
                value={formData.sobreNome}
                onChange={handleChange}
                data-cy="form-sobrenome"
              />
            </FormField>
            <FormField id="campo-cpf" label="CPF" obrigatorio colunas={6} erro={erros.cpf}>
              <input
                type="text"
                name="cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                maxLength={14}
                value={formData.cpf}
                onChange={handleChange}
                data-cy="form-cpf"
              />
            </FormField>
            <FormField
              id="campo-dtaNascimento"
              label="Data de nascimento"
              obrigatorio
              colunas={6}
              erro={erros.dtaNascimento}
            >
              <input
                type="date"
                name="dtaNascimento"
                value={formData.dtaNascimento}
                onChange={handleChange}
                data-cy="form-nascimento"
              />
            </FormField>
            <FormField id="campo-email" label="E-mail" obrigatorio colunas={6} erro={erros.email}>
              <input
                type="email"
                name="email"
                autoComplete="off"
                value={formData.email}
                onChange={handleChange}
                data-cy="form-email"
              />
            </FormField>
            <FormField
              id="campo-celular"
              label="Celular"
              obrigatorio
              colunas={6}
              erro={erros.celular}
            >
              <input
                type="tel"
                name="celular"
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                maxLength={15}
                value={formData.celular}
                onChange={handleChange}
                data-cy="form-celular"
              />
            </FormField>
            <LojaDoCadastro colunas={12} />
          </div>

          <div className="form-rodape">
            <ButtonLink to="/listagem-clientes" variante="secundario">
              Cancelar
            </ButtonLink>
            <Button type="submit" carregando={salvando} data-cy="form-salvar">
              Salvar cliente
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
