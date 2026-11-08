// @requisito RE-11 RO-24
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { concluirCadastro } from "@/lib/fluxoCadastro";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { cobrancistasService } from "@/services/endpoints";
import {
  somenteDigitos,
  validarCelular,
  validarEmail,
  validarTelefoneFixo,
} from "@/lib/validators";
import { Button, ButtonLink, Card, FormField, PageHeader, LojaDoCadastro } from "@/components/ds";
import { useErrosFormulario } from "@/hooks/useErrosFormulario";

export default function CadastroCobrancista() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    celular: "",
    telefone: "",
    descricao: "",
  });
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const { erros, falhar, limpar } = useErrosFormulario();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === "nome") {
      value = value
        .replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
        .replace(/\b\w/g, (char: string) => char.toUpperCase());
    } else if (name === "celular") {
      value = value.replace(/\D/g, "");
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
      }
    } else if (name === "telefone") {
      value = value.replace(/\D/g, "");
      if (value.length <= 10) {
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value.substring(
        0,
        (e.target as HTMLInputElement).maxLength > 0
          ? (e.target as HTMLInputElement).maxLength
          : 100,
      ),
    }));
    limpar(name);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;

    const payload = {
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      celular: somenteDigitos(formData.celular),
      telefone: somenteDigitos(formData.telefone) || null,
      descricao: formData.descricao.trim(),
    };

    if (!payload.nome) return falhar("nome", "Informe o nome do cobrancista.");
    if (!validarEmail(payload.email)) return falhar("email", "Informe um e-mail válido.");
    if (!validarCelular(payload.celular))
      return falhar("celular", "Informe um celular válido com DDD.");
    if (payload.telefone && !validarTelefoneFixo(payload.telefone)) {
      return falhar("telefone", "Telefone fixo inválido (DDD + 8 dígitos).");
    }

    setSalvando(true);
    try {
      const criado = await cobrancistasService.criar(payload);
      toast.success("Cobrancista cadastrado com sucesso!");
      concluirCadastro({ navigate, listagem: "/listagem-cobrancistas", criado });
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Novo cobrancista"
        descricao="Contato responsável pelas cobranças da loja."
        voltar={{ to: "/listagem-cobrancistas", rotulo: "Cobrancistas" }}
      />
      <Card como="section" className="form-card">
        <form onSubmit={handleSalvar} noValidate data-cy="form-cobrancista">
          <div className="form-grade">
            <FormField
              id="campo-nome"
              label="Nome completo"
              obrigatorio
              colunas={6}
              erro={erros.nome}
            >
              <input
                type="text"
                name="nome"
                autoComplete="off"
                value={formData.nome}
                onChange={handleChange}
                data-cy="form-nome"
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
            <FormField
              id="campo-telefone"
              label="Telefone fixo"
              colunas={6}
              erro={erros.telefone}
              ajuda="Opcional."
            >
              <input
                type="tel"
                name="telefone"
                inputMode="numeric"
                placeholder="(00) 0000-0000"
                maxLength={14}
                value={formData.telefone}
                onChange={handleChange}
                data-cy="form-telefone"
              />
            </FormField>
            <LojaDoCadastro colunas={12} />
            <FormField id="campo-descricao" label="Observações">
              <textarea
                name="descricao"
                rows={3}
                value={formData.descricao}
                onChange={handleChange}
                data-cy="form-descricao"
              />
            </FormField>
          </div>

          <div className="form-rodape">
            <ButtonLink to="/listagem-cobrancistas" variante="secundario">
              Cancelar
            </ButtonLink>
            <Button type="submit" carregando={salvando} data-cy="form-salvar">
              Salvar cobrancista
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
