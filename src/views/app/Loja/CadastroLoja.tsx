// @requisito RE-02 RO-17
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { concluirCadastro } from "@/lib/fluxoCadastro";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { lojasService } from "@/services/endpoints";
import { entrarNaLojaCriada } from "@/lib/contexto";
import {
  somenteDigitos,
  validarCNPJ,
  validarCelular,
  validarEmail,
  validarTelefoneFixo,
} from "@/lib/validators";
import { Button, ButtonLink, Card, FormField, PageHeader } from "@/components/ds";
import { useErrosFormulario } from "@/hooks/useErrosFormulario";

const ESTADOS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export default function CadastroLoja() {
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    celular: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const { erros, falhar, limpar } = useErrosFormulario();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    let { value } = e.target;

    // 1. Campos de texto com capitalização (permite letras e espaços)
    if (["logradouro", "bairro", "cidade"].includes(name)) {
      value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
      value = value.replace(/\b\w/g, (char: string) => char.toUpperCase());
    }
    // 2. Máscaras numéricas (permite apenas números)
    else if (name === "cnpj") {
      value = value
        .replace(/\D/g, "")
        .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    } else if (name === "cep") {
      value = value.replace(/\D/g, "").replace(/^(\d{5})(\d{3})/, "$1-$2");
    } else if (name === "celular") {
      value = value.replace(/\D/g, "");
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
      }
    } else if (name === "numero") {
      value = value.replace(/\D/g, "");
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
      cnpj: somenteDigitos(formData.cnpj),
      email: formData.email.trim(),
      celular: somenteDigitos(formData.celular),
      cep: somenteDigitos(formData.cep),
      logradouro: formData.logradouro.trim(),
      numero: formData.numero.trim(),
      bairro: formData.bairro.trim(),
      cidade: formData.cidade.trim(),
      estado: formData.estado,
    };

    if (!payload.nome) return falhar("nome", "Informe o nome da loja.");
    if (!validarCNPJ(payload.cnpj)) return falhar("cnpj", "CNPJ inválido.");
    if (!validarEmail(payload.email)) return falhar("email", "Informe um e-mail válido.");
    if (!validarCelular(payload.celular) && !validarTelefoneFixo(payload.celular)) {
      return falhar("celular", "Informe um celular ou telefone válido com DDD.");
    }
    if (payload.cep.length !== 8) return falhar("cep", "O CEP deve conter 8 dígitos.");
    for (const campo of ["logradouro", "numero", "bairro", "cidade", "estado"] as const) {
      if (!payload[campo]) return falhar(campo, "Preencha o endereço completo.");
    }

    setSalvando(true);
    try {
      const criado = await lojasService.criar(payload);
      toast.success("Loja cadastrada com sucesso!");
      // O backend já vinculou quem criou como GERENTE: entra na loja nova para
      // os próximos cadastros (áreas, funcionários...) irem para ela.
      try {
        const ativa = await entrarNaLojaCriada(criado?.id);
        if (ativa) toast.info(`Agora você está na loja ${ativa.nomeLoja}.`);
      } catch {
        // Sem contexto, a navegação leva para a escolha da loja.
      }
      concluirCadastro({ navigate, listagem: "/listagem-lojas", criado, etapa: "loja" });
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Nova loja"
        descricao="Dados da unidade e endereço."
        voltar={{ to: "/listagem-lojas", rotulo: "Lojas" }}
      />
      <Card como="section" className="form-card">
        <form onSubmit={handleSalvar} noValidate data-cy="form-loja">
          <h2 className="card__secao-titulo">Identificação</h2>
          <div className="form-grade">
            <FormField
              id="campo-nome"
              label="Nome da loja"
              obrigatorio
              colunas={8}
              erro={erros.nome}
            >
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                data-cy="form-nome"
              />
            </FormField>
            <FormField id="campo-cnpj" label="CNPJ" obrigatorio colunas={4} erro={erros.cnpj}>
              <input
                type="text"
                name="cnpj"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                maxLength={18}
                value={formData.cnpj}
                onChange={handleChange}
                data-cy="form-cnpj"
              />
            </FormField>
            <FormField id="campo-email" label="E-mail" obrigatorio colunas={6} erro={erros.email}>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                data-cy="form-email"
              />
            </FormField>
            <FormField
              id="campo-celular"
              label="Celular ou telefone"
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
          </div>

          <div className="card__secao">
            <h2 className="card__secao-titulo">Endereço</h2>
            <div className="form-grade">
              <FormField id="campo-cep" label="CEP" obrigatorio colunas={4} erro={erros.cep}>
                <input
                  type="text"
                  name="cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  maxLength={9}
                  value={formData.cep}
                  onChange={handleChange}
                  data-cy="form-cep"
                />
              </FormField>
              <FormField
                id="campo-logradouro"
                label="Logradouro"
                obrigatorio
                colunas={8}
                erro={erros.logradouro}
              >
                <input
                  type="text"
                  name="logradouro"
                  autoComplete="address-line1"
                  value={formData.logradouro}
                  onChange={handleChange}
                  data-cy="form-logradouro"
                />
              </FormField>
              <FormField
                id="campo-numero"
                label="Número"
                obrigatorio
                colunas={3}
                erro={erros.numero}
              >
                <input
                  type="text"
                  name="numero"
                  inputMode="numeric"
                  value={formData.numero}
                  onChange={handleChange}
                  data-cy="form-numero"
                />
              </FormField>
              <FormField
                id="campo-bairro"
                label="Bairro"
                obrigatorio
                colunas={3}
                erro={erros.bairro}
              >
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleChange}
                  data-cy="form-bairro"
                />
              </FormField>
              <FormField
                id="campo-cidade"
                label="Cidade"
                obrigatorio
                colunas={4}
                erro={erros.cidade}
              >
                <input
                  type="text"
                  name="cidade"
                  autoComplete="address-level2"
                  value={formData.cidade}
                  onChange={handleChange}
                  data-cy="form-cidade"
                />
              </FormField>
              <FormField id="campo-estado" label="UF" obrigatorio colunas={2} erro={erros.estado}>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  data-cy="form-estado"
                >
                  <option value="">—</option>
                  {ESTADOS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          <div className="form-rodape">
            <ButtonLink to="/listagem-lojas" variante="secundario">
              Cancelar
            </ButtonLink>
            <Button type="submit" carregando={salvando} data-cy="form-salvar">
              Salvar loja
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
