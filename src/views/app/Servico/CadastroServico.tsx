// @requisito RE-03 RO-18 RNR-13 RNR-14 RNR-22
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { concluirCadastro } from "@/lib/fluxoCadastro";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { areasAtuacaoService, servicosService } from "@/services/endpoints";
import {
  Button,
  ButtonLink,
  Card,
  FormField,
  PageHeader,
  SelectCarregado,
  LojaDoCadastro,
} from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { useErrosFormulario } from "@/hooks/useErrosFormulario";

export default function CadastroServico() {
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    comissaoLoja: "",
    duracaoMinutos: "30",
    idArea: "",
    descricao: "",
  });
  const areas = useCarregar(() => areasAtuacaoService.listar(), []);
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const { erros, falhar, limpar } = useErrosFormulario();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name } = e.target;
    let { value } = e.target;

    // 1. Nome: Capitaliza a primeira letra de cada palavra
    if (name === "nome") {
      value = value.replace(/\b\w/g, (char: string) => char.toUpperCase());
    }
    // 2. Preço: Apenas números e ponto (positivo)
    else if (name === "preco") {
      value = value.replace(",", ".").replace(/[^0-9.]/g, "");
    }
    // 3. Comissão: Apenas números (0 a 100)
    else if (name === "comissaoLoja") {
      value = value.replace(/[^0-9]/g, "");
      if (Number(value) > 100) value = "100";
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    limpar(name);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;

    const preco = Number(formData.preco);
    const comissaoLoja = Number(formData.comissaoLoja);
    const payload = {
      nome: formData.nome.trim(),
      preco,
      comissaoLoja,
      descricao: formData.descricao.trim(),
      idArea: Number(formData.idArea),
      // Usada na agenda e nos horários livres (motor de horários).
      duracaoMinutos: Number(formData.duracaoMinutos),
    };

    if (!payload.nome) return falhar("nome", "Informe o nome do serviço.");
    if (formData.preco === "" || !Number.isFinite(preco) || preco < 0) {
      return falhar("preco", "Informe um preço válido.");
    }
    if (
      formData.comissaoLoja === "" ||
      !Number.isFinite(comissaoLoja) ||
      comissaoLoja < 0 ||
      comissaoLoja > 100
    ) {
      return falhar("comissaoLoja", "A comissão da loja deve estar entre 0 e 100%.");
    }
    if (!payload.idArea) return falhar("idArea", "Selecione a área de atuação.");

    setSalvando(true);
    try {
      const criado = await servicosService.criar(payload);
      toast.success("Serviço cadastrado com sucesso!");
      concluirCadastro({ navigate, listagem: "/listagem-servicos", criado, etapa: "servico" });
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Novo serviço"
        descricao="Preço, comissão da loja e área de atuação."
        voltar={{ to: "/listagem-servicos", rotulo: "Serviços" }}
      />
      <Card como="section" className="form-card">
        <form onSubmit={handleSalvar} noValidate data-cy="form-servico">
          <div className="form-grade">
            <FormField id="campo-nome" label="Nome do serviço" obrigatorio erro={erros.nome}>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                data-cy="form-nome"
              />
            </FormField>
            <FormField
              id="campo-preco"
              label="Preço (R$)"
              obrigatorio
              colunas={6}
              erro={erros.preco}
              ajuda="Use ponto ou vírgula para os centavos."
            >
              <input
                type="text"
                name="preco"
                inputMode="decimal"
                placeholder="0,00"
                value={formData.preco}
                onChange={handleChange}
                data-cy="form-preco"
              />
            </FormField>
            <FormField
              id="campo-comissaoLoja"
              label="Comissão da loja (%)"
              obrigatorio
              colunas={6}
              erro={erros.comissaoLoja}
              ajuda="De 0 a 100."
            >
              <input
                type="text"
                name="comissaoLoja"
                inputMode="numeric"
                value={formData.comissaoLoja}
                onChange={handleChange}
                data-cy="form-comissao"
              />
            </FormField>
            <FormField
              id="campo-duracaoMinutos"
              label="Duração"
              obrigatorio
              colunas={6}
              erro={erros.duracaoMinutos}
              ajuda="Tempo que o horário fica ocupado na agenda."
            >
              <select
                name="duracaoMinutos"
                value={formData.duracaoMinutos}
                onChange={handleChange}
                data-cy="form-duracao"
              >
                {[15, 20, 30, 40, 45, 60, 75, 90, 105, 120, 150, 180, 240].map((m) => (
                  <option key={m} value={m}>
                    {m < 60
                      ? `${m} min`
                      : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`}
                  </option>
                ))}
              </select>
            </FormField>
            <LojaDoCadastro colunas={6} />
            <SelectCarregado
              id="campo-idArea"
              name="idArea"
              label="Área de atuação"
              obrigatorio
              colunas={6}
              value={formData.idArea}
              onChange={handleChange}
              erro={erros.idArea}
              itens={areas.dados}
              carregando={areas.carregando}
              erroCarregamento={areas.erro}
              onTentarNovamente={areas.recarregar}
              valorItem={(a) => a.id}
              rotuloItem={(a) => a.nome}
              nomePlural="áreas"
              vazioTexto="Nenhuma área cadastrada."
              cadastrarEm="/cadastro-area-atuacao"
              data-cy="form-area"
            />
            <FormField id="campo-descricao" label="Descrição" erro={erros.descricao}>
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
            <ButtonLink to="/listagem-servicos" variante="secundario">
              Cancelar
            </ButtonLink>
            <Button type="submit" carregando={salvando} data-cy="form-salvar">
              Salvar serviço
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
