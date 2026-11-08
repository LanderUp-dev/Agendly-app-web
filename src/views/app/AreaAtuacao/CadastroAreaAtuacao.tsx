// @requisito RE-05 RO-20
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { concluirCadastro } from "@/lib/fluxoCadastro";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { areasAtuacaoService } from "@/services/endpoints";
import { Button, ButtonLink, Card, FormField, PageHeader, LojaDoCadastro } from "@/components/ds";
import { useErrosFormulario } from "@/hooks/useErrosFormulario";

export default function CadastroAreaAtuacao() {
  const [formData, setFormData] = useState({ nome: "", descricao: "" });
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const { erros, falhar, limpar } = useErrosFormulario();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    limpar(name);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;

    const payload = {
      nome: formData.nome.trim(),
      descricao: formData.descricao.trim(),
    };

    if (!payload.nome) return falhar("nome", "Informe o nome da área.");

    setSalvando(true);
    try {
      const criado = await areasAtuacaoService.criar(payload);
      toast.success("Área de atuação cadastrada com sucesso!");
      concluirCadastro({ navigate, listagem: "/listagem-areas-atuacao", criado, etapa: "area" });
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Nova área de atuação"
        descricao="Setor ou categoria de serviços de uma loja (ex.: Cabelo, Estética)."
        voltar={{ to: "/listagem-areas-atuacao", rotulo: "Áreas de atuação" }}
      />
      <Card como="section" className="form-card">
        <form onSubmit={handleSalvar} noValidate data-cy="form-area">
          <div className="form-grade">
            <FormField
              id="campo-nome"
              label="Nome da área"
              obrigatorio
              colunas={6}
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
            <LojaDoCadastro colunas={6} />
            <FormField
              id="campo-descricao"
              label="Descrição"
              ajuda="Opcional. Quais serviços pertencem a esta área."
            >
              <textarea
                name="descricao"
                rows={4}
                value={formData.descricao}
                onChange={handleChange}
                data-cy="form-descricao"
              />
            </FormField>
          </div>

          <div className="form-rodape">
            <ButtonLink to="/listagem-areas-atuacao" variante="secundario">
              Cancelar
            </ButtonLink>
            <Button type="submit" carregando={salvando} data-cy="form-salvar">
              Salvar área
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
