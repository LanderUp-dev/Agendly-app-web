// @requisito RE-12 RO-25
import React, { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { concluirCadastro } from "@/lib/fluxoCadastro";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { clientesService } from "@/services/endpoints";
import { somenteDigitos, validarCPF, validarCelular, validarEmail } from "@/lib/validators";
import {
  Button,
  ButtonLink,
  Card,
  Carregando,
  ErrorState,
  FormField,
  PageHeader,
  LojaDoCadastro,
} from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { useErrosFormulario } from "@/hooks/useErrosFormulario";

interface ClienteSalvo {
  id: number;
  nome?: string;
  sobreNome?: string;
  cpf?: string;
  email?: string;
  celular?: string;
  dtaNascimento?: string;
}

const mascaraCelular = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

const mascaraCpf = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

/**
 * Novo cliente ou edição (com ?id=). Só o nome é obrigatório (RO-25): o cliente cadastrado às
 * pressas na agenda, só com nome e celular, é completado aqui depois.
 */
export default function CadastroCliente({ id = 0 }: { id?: number }) {
  const editando = id > 0;
  const existente = useCarregar<ClienteSalvo | null>(
    () => (editando ? clientesService.buscar(id) : Promise.resolve(null)),
    null,
  );
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

  useEffect(() => {
    const c = existente.dados;
    if (!c) return;
    setFormData({
      nome: c.nome ?? "",
      sobreNome: c.sobreNome ?? "",
      cpf: mascaraCpf(c.cpf ?? ""),
      email: c.email ?? "",
      celular: mascaraCelular(c.celular ?? ""),
      dtaNascimento: c.dtaNascimento ?? "",
    });
  }, [existente.dados]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "nome" || name === "sobreNome") value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
    else if (name === "celular") value = mascaraCelular(value);
    else if (name === "cpf") value = mascaraCpf(value);
    setFormData((prev) => ({ ...prev, [name]: value }));
    limpar(name);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;

    // ClienteDTO usa `sobreNome` (com N maiúsculo). Campo opcional vazio vai como null.
    const payload = {
      nome: formData.nome.trim(),
      sobreNome: formData.sobreNome.trim() || null,
      cpf: somenteDigitos(formData.cpf) || null,
      email: formData.email.trim() || null,
      celular: somenteDigitos(formData.celular) || null,
      dtaNascimento: formData.dtaNascimento || null,
    };

    if (!payload.nome) return falhar("nome", "Informe o nome do cliente.");
    if (payload.cpf && !validarCPF(payload.cpf)) return falhar("cpf", "CPF inválido.");
    if (payload.email && !validarEmail(payload.email))
      return falhar("email", "Informe um e-mail válido ou deixe em branco.");
    if (payload.celular && !validarCelular(payload.celular))
      return falhar("celular", "Celular inválido: use o DDD e o número.");

    setSalvando(true);
    try {
      if (editando) {
        await clientesService.atualizar(id, payload);
        toast.success("Cliente atualizado.");
        navigate({ to: "/listagem-clientes" });
      } else {
        const criado = await clientesService.criar(payload);
        toast.success("Cliente cadastrado com sucesso!");
        concluirCadastro({ navigate, listagem: "/listagem-clientes", criado, etapa: "cliente" });
      }
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
    } finally {
      setSalvando(false);
    }
  };

  const cabecalho = (
    <PageHeader
      titulo={editando ? "Editar cliente" : "Novo cliente"}
      descricao={
        editando
          ? "Complete ou corrija os dados do cliente."
          : "Só o nome é obrigatório. O celular serve para confirmar horários pelo WhatsApp."
      }
      voltar={{ to: "/listagem-clientes", rotulo: "Clientes" }}
    />
  );

  if (editando && (existente.carregando || existente.erro || !existente.dados)) {
    return (
      <Layout>
        {cabecalho}
        {existente.carregando ? (
          <Carregando ativo contexto="Carregando cliente..." />
        ) : (
          <ErrorState
            mensagem={existente.erro?.mensagem ?? "Cliente não encontrado."}
            onTentarNovamente={existente.recarregar}
          />
        )}
      </Layout>
    );
  }

  return (
    <Layout>
      {cabecalho}
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
            <FormField id="campo-sobreNome" label="Sobrenome" colunas={6} erro={erros.sobreNome}>
              <input
                type="text"
                name="sobreNome"
                autoComplete="off"
                value={formData.sobreNome}
                onChange={handleChange}
                data-cy="form-sobrenome"
              />
            </FormField>
            <FormField id="campo-celular" label="Celular" colunas={6} erro={erros.celular}>
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
            <FormField id="campo-email" label="E-mail" colunas={6} erro={erros.email}>
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
              id="campo-dtaNascimento"
              label="Data de nascimento"
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
            <FormField id="campo-cpf" label="CPF" colunas={6} erro={erros.cpf}>
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
            {!editando && <LojaDoCadastro colunas={12} />}
          </div>

          <div className="form-rodape">
            <ButtonLink to="/listagem-clientes" variante="secundario">
              Cancelar
            </ButtonLink>
            <Button type="submit" carregando={salvando} data-cy="form-salvar">
              {editando ? "Salvar alterações" : "Salvar cliente"}
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
