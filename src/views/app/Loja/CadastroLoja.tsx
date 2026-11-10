// @requisito RE-02 RO-17 RNR-20
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isAxiosError } from "axios";
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

/** Mesmo texto do backend (LimiteLojasService.MENSAGEM). */
const MENSAGEM_SEM_PLANO = "Para criar outra loja, assine um plano em uma das suas lojas.";

/** (00) 0000-0000 para fixo e (00) 00000-0000 para celular, enquanto digita. */
function mascaraTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  const meio = d.length === 11 ? 5 : 4;
  const ddd = `(${d.slice(0, 2)}) `;
  const resto = d.slice(2);
  return resto.length > meio
    ? `${ddd}${resto.slice(0, meio)}-${resto.slice(meio)}`
    : `${ddd}${resto}`;
}

export default function CadastroLoja() {
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    celular: "",
    telefone: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });
  const [salvando, setSalvando] = useState(false);
  const [semPlano, setSemPlano] = useState(false);
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
    } else if (name === "telefone") {
      value = mascaraTelefone(value);
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
      telefone: somenteDigitos(formData.telefone) || undefined,
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
    if (
      payload.telefone &&
      !validarCelular(payload.telefone) &&
      !validarTelefoneFixo(payload.telefone)
    ) {
      return falhar("telefone", "Telefone inválido. Informe o DDD e o número (fixo ou celular).");
    }
    if (payload.cep.length !== 8) return falhar("cep", "O CEP deve conter 8 dígitos.");
    for (const campo of ["logradouro", "numero", "bairro", "cidade", "estado"] as const) {
      if (!payload[campo]) return falhar(campo, "Preencha o endereço completo.");
    }

    setSalvando(true);
    setSemPlano(false);
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
    } catch (err) {
      // Mensagem do backend exibida pelo interceptor do axios.
      // RNR-20: sem plano não cria a segunda loja; mostra o caminho para assinar.
      const dados = isAxiosError(err) ? err.response?.data : undefined;
      if (typeof dados === "string" && dados.includes("assine um plano")) {
        setSemPlano(true);
        requestAnimationFrame(() => document.getElementById("aviso-sem-plano")?.focus());
      }
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
          {semPlano && (
            <div
              id="aviso-sem-plano"
              className="alerta alerta-aviso"
              role="alert"
              tabIndex={-1}
              data-cy="aviso-sem-plano"
            >
              <span>{MENSAGEM_SEM_PLANO}</span>
              <ButtonLink to="/plano" variante="secundario" data-cy="ir-para-plano">
                Ver planos
              </ButtonLink>
            </div>
          )}
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
            <FormField
              id="campo-telefone"
              label="Telefone (opcional)"
              colunas={6}
              erro={erros.telefone}
            >
              <input
                type="tel"
                name="telefone"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(00) 0000-0000"
                maxLength={15}
                value={formData.telefone}
                onChange={handleChange}
                data-cy="form-telefone"
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
