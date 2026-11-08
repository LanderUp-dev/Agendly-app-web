// @requisito RO-28 RR-45
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { concluirCadastro } from "@/lib/fluxoCadastro";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { equipesService } from "@/services/endpoints";
import { validarEmail } from "@/lib/validators";
import { Button, ButtonLink, Card, FormField, LojaDoCadastro, PageHeader } from "@/components/ds";
import { useErrosFormulario } from "@/hooks/useErrosFormulario";

/**
 * Equipe liga uma CONTA de usuário (não um Funcionário) à loja ativa.
 *
 * Por segurança a API não lista usuários de fora da loja, então o novo membro
 * é informado pelo e-mail da conta dele. A pessoa precisa ter se cadastrado
 * antes no Agendly. Entra com o cargo padrão (COLABORADOR).
 */
export default function CadastroEquipe() {
  const [email, setEmail] = useState("");
  const [salvando, setSalvando] = useState(false);
  const navigate = useNavigate();
  const { erros, falhar, limpar } = useErrosFormulario();

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;

    const emailUsuario = email.trim().toLowerCase();
    if (!validarEmail(emailUsuario))
      return falhar("emailUsuario", "Informe o e-mail da conta do usuário.");

    setSalvando(true);
    try {
      const criado = await equipesService.criar({ emailUsuario });
      toast.success("Usuário adicionado à equipe da loja!");
      concluirCadastro({ navigate, listagem: "/listagem-equipes", criado });
    } catch {
      // Mensagem do backend (ex.: "Nenhuma conta cadastrada com este e-mail")
      // exibida pelo interceptor do axios.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Adicionar à equipe"
        descricao="Dá a uma conta do Agendly acesso à loja atual. A pessoa precisa já ter se cadastrado."
        voltar={{ to: "/listagem-equipes", rotulo: "Equipes" }}
      />
      <Card como="section" className="form-card">
        <form onSubmit={handleSalvar} noValidate data-cy="form-equipe">
          <div className="form-grade">
            <FormField
              id="campo-emailUsuario"
              label="E-mail da conta"
              obrigatorio
              colunas={6}
              erro={erros.emailUsuario}
              ajuda="O mesmo e-mail que a pessoa usa para entrar no Agendly."
            >
              <input
                type="email"
                name="emailUsuario"
                autoComplete="off"
                inputMode="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  limpar("emailUsuario");
                }}
                data-cy="form-email-usuario"
              />
            </FormField>
            <LojaDoCadastro colunas={6} />
          </div>

          <div className="form-rodape">
            <ButtonLink to="/listagem-equipes" variante="secundario">
              Cancelar
            </ButtonLink>
            <Button type="submit" carregando={salvando} data-cy="form-salvar">
              Adicionar
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
