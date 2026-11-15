// @requisito RE-04 RO-19 RNR-23
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { concluirCadastro } from "@/lib/fluxoCadastro";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { funcionariosService, tornarMeProfissional } from "@/services/endpoints";
import { somenteDigitos, validarCPF, validarCelular, validarEmail } from "@/lib/validators";
import { Button, ButtonLink, Card, FormField, PageHeader, LojaDoCadastro } from "@/components/ds";
import { useErrosFormulario } from "@/hooks/useErrosFormulario";
import { AvisoLimiteProfissionais } from "./LimiteProfissionais";
import { useLimiteProfissionais } from "@/hooks/useLimiteProfissionais";

export default function CadastroFuncionario() {
  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    cpf: "",
    dtaNascimento: "",
    email: "",
    celular: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [entrando, setEntrando] = useState(false);
  const navigate = useNavigate();
  const { erros, falhar, limpar } = useErrosFormulario();
  // RNR-23: no limite do plano, avisa antes e não deixa tentar (o backend também confere).
  const { situacao } = useLimiteProfissionais();
  const cheio = situacao?.podeCadastrar === false;

  /** O dono (ou quem está logado) também atende: entra na agenda com os dados da própria conta. */
  const souEu = async () => {
    if (entrando || salvando) return;
    setEntrando(true);
    try {
      const criado = await tornarMeProfissional();
      toast.success("Pronto! Você agora aparece na agenda como profissional.");
      concluirCadastro({
        navigate,
        listagem: "/listagem-funcionarios",
        criado,
        etapa: "funcionario",
      });
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
    } finally {
      setEntrando(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    let { value } = e.target;

    // Filtros de digitação e máscaras
    if (name === "nome" || name === "sobrenome") {
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

    // FuncionarioDTO: dtaNascimento em yyyy-MM-dd, documentos só com dígitos.
    const payload = {
      nome: formData.nome.trim(),
      sobrenome: formData.sobrenome.trim(),
      // CPF opcional (RO-19): vazio não é enviado.
      cpf: somenteDigitos(formData.cpf) || undefined,
      dtaNascimento: formData.dtaNascimento,
      email: formData.email.trim(),
      celular: somenteDigitos(formData.celular),
    };

    if (!payload.nome) return falhar("nome", "Informe o nome do funcionário.");
    if (payload.cpf && !validarCPF(payload.cpf)) return falhar("cpf", "CPF inválido.");
    if (!payload.dtaNascimento) return falhar("dtaNascimento", "Informe a data de nascimento.");
    if (!validarEmail(payload.email)) return falhar("email", "Informe um e-mail válido.");
    if (!validarCelular(payload.celular))
      return falhar("celular", "Informe um celular válido com DDD.");

    setSalvando(true);
    try {
      const criado = await funcionariosService.criar(payload);
      toast.success("Funcionário cadastrado com sucesso!");
      concluirCadastro({
        navigate,
        listagem: "/listagem-funcionarios",
        criado,
        etapa: "funcionario",
      });
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Novo funcionário"
        descricao="Dados pessoais e a loja onde trabalha."
        voltar={{ to: "/listagem-funcionarios", rotulo: "Funcionários" }}
      />
      <Card como="section" className="form-card">
        <AvisoLimiteProfissionais situacao={situacao} />
        <div className="alerta alerta-info alerta-com-acao" data-cy="sou-eu">
          <span>Você também atende clientes? Entre na agenda com os dados da sua conta.</span>
          <Button
            type="button"
            variante="secundario"
            carregando={entrando}
            disabled={cheio}
            onClick={souEu}
            data-cy="sou-eu-botao"
          >
            Eu também atendo
          </Button>
        </div>
        <form onSubmit={handleSalvar} noValidate data-cy="form-funcionario">
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
              id="campo-sobrenome"
              label="Sobrenome"
              obrigatorio
              colunas={6}
              erro={erros.sobrenome}
            >
              <input
                type="text"
                name="sobrenome"
                autoComplete="off"
                value={formData.sobrenome}
                onChange={handleChange}
                data-cy="form-sobrenome"
              />
            </FormField>
            <FormField id="campo-cpf" label="CPF (opcional)" colunas={6} erro={erros.cpf}>
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
            <ButtonLink to="/listagem-funcionarios" variante="secundario">
              Cancelar
            </ButtonLink>
            <Button type="submit" carregando={salvando} disabled={cheio} data-cy="form-salvar">
              Salvar funcionário
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
