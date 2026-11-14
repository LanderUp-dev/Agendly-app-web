// @requisito RE-01 RO-16 RS-13
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button, Card, Carregando, ErrorState, FormField, PageHeader } from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { atualizarNomeDaSessao, obterUsuario } from "@/lib/auth";
import { formatarCPF } from "@/lib/formatadores";
import { avaliarSenha, senhaValida } from "@/lib/senha";
import { somenteDigitos, validarCelular } from "@/lib/validators";
import { usuariosService } from "@/services/endpoints";
import type { UsuarioResponse } from "@/types/auth";

function mascaraCelular(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** CPF mostrado só com o final: 000.000.000-00 vira ***.***.*89-09. */
const cpfMascarado = (cpf?: string | null) =>
  cpf ? formatarCPF(cpf).replace(/^\d{3}\.\d{3}\.\d/, "***.***.*") : "";

/**
 * Minha conta: os dados de quem está logado (nome, celular) e a troca de senha.
 * O e-mail é o login e não muda por aqui. Trocar a senha exige a senha atual.
 */
export default function MinhaConta() {
  const id = obterUsuario()?.id;
  const conta = useCarregar<UsuarioResponse | null>(
    () => (id == null ? Promise.resolve(null) : usuariosService.buscar(id)),
    null,
  );
  const [dados, setDados] = useState({ nome: "", sobrenome: "", celular: "" });
  const [erros, setErros] = useState<Record<string, string | undefined>>({});
  const [salvando, setSalvando] = useState<"dados" | "senha" | null>(null);
  const [senha, setSenha] = useState({ atual: "", nova: "", confirmar: "" });

  useEffect(() => {
    if (!conta.dados) return;
    setDados({
      nome: conta.dados.nome ?? "",
      sobrenome: conta.dados.sobrenome ?? "",
      celular: mascaraCelular(conta.dados.celular ?? ""),
    });
  }, [conta.dados]);

  const falhar = (campo: string, mensagem: string) => {
    setErros({ [campo]: mensagem });
    requestAnimationFrame(() => document.getElementById(`campo-${campo}`)?.focus());
  };

  /** O backend recebe a conta inteira: o que não é editado aqui volta como veio. */
  const enviar = async (extra: Record<string, string>, qual: "dados" | "senha") => {
    if (!conta.dados || id == null) return false;
    setSalvando(qual);
    try {
      await usuariosService.atualizar(id, {
        nome: dados.nome.trim(),
        sobrenome: dados.sobrenome.trim(),
        celular: somenteDigitos(dados.celular),
        email: conta.dados.email,
        dtaNascimento: conta.dados.dtaNascimento,
        ...extra,
      });
      return true;
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
      return false;
    } finally {
      setSalvando(null);
    }
  };

  const salvarDados = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    if (dados.nome.trim().length < 2) return falhar("nome", "Informe seu nome.");
    if (dados.sobrenome.trim().length < 2) return falhar("sobrenome", "Informe seu sobrenome.");
    if (!validarCelular(somenteDigitos(dados.celular)))
      return falhar("celular", "Informe um celular válido com DDD.");
    setErros({});
    if (await enviar({}, "dados")) {
      atualizarNomeDaSessao(dados.nome.trim());
      toast.success("Dados atualizados.");
    }
  };

  const requisitos = avaliarSenha(senha.nova);

  const trocarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    if (!senha.atual) return falhar("senhaAtual", "Informe a senha atual.");
    if (!senhaValida(senha.nova) || senha.nova.length > 72)
      return falhar(
        "senhaNova",
        "A senha nova precisa de 8 caracteres ou mais, com letras e números.",
      );
    if (senha.nova !== senha.confirmar) return falhar("senhaConfirmar", "As senhas não coincidem.");
    setErros({});
    if (await enviar({ senhaAtual: senha.atual, senha: senha.nova }, "senha")) {
      setSenha({ atual: "", nova: "", confirmar: "" });
      toast.success("Senha alterada.");
    }
  };

  return (
    <Layout>
      <PageHeader titulo="Minha conta" descricao="Seus dados de acesso ao Agendly." />
      {conta.carregando && <Carregando ativo contexto="Carregando sua conta..." />}
      {!conta.carregando && conta.erro && (
        <ErrorState mensagem={conta.erro.mensagem} onTentarNovamente={conta.recarregar} />
      )}
      {!conta.carregando && !conta.erro && conta.dados && (
        <>
          <Card como="section" className="form-card">
            <h2 className="card__secao-titulo">Seus dados</h2>
            <form onSubmit={salvarDados} noValidate data-cy="form-conta">
              <div className="form-grade">
                <FormField id="campo-nome" label="Nome" obrigatorio colunas={6} erro={erros.nome}>
                  <input
                    type="text"
                    name="nome"
                    autoComplete="given-name"
                    maxLength={80}
                    value={dados.nome}
                    onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                    data-cy="conta-nome"
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
                    autoComplete="family-name"
                    maxLength={80}
                    value={dados.sobrenome}
                    onChange={(e) => setDados({ ...dados, sobrenome: e.target.value })}
                    data-cy="conta-sobrenome"
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
                    autoComplete="tel-national"
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={dados.celular}
                    onChange={(e) =>
                      setDados({ ...dados, celular: mascaraCelular(e.target.value) })
                    }
                    data-cy="conta-celular"
                  />
                </FormField>
                <FormField
                  id="campo-email"
                  label="E-mail (seu login)"
                  colunas={6}
                  ajuda="O e-mail não muda por aqui."
                >
                  <input type="email" name="email" value={conta.dados.email ?? ""} readOnly />
                </FormField>
                {conta.dados.cpf && (
                  <FormField
                    id="campo-cpf"
                    label="CPF"
                    colunas={6}
                    ajuda="Informado ao criar a loja. Aparece só o final."
                  >
                    <input type="text" name="cpf" value={cpfMascarado(conta.dados.cpf)} readOnly />
                  </FormField>
                )}
              </div>
              <div className="form-rodape">
                <Button type="submit" carregando={salvando === "dados"} data-cy="conta-salvar">
                  Salvar dados
                </Button>
              </div>
            </form>
          </Card>

          <Card como="section" className="form-card">
            <h2 className="card__secao-titulo">Trocar a senha</h2>
            <form onSubmit={trocarSenha} noValidate data-cy="form-senha">
              <div className="form-grade">
                <FormField
                  id="campo-senhaAtual"
                  label="Senha atual"
                  obrigatorio
                  erro={erros.senhaAtual}
                >
                  <input
                    type="password"
                    name="senhaAtual"
                    autoComplete="current-password"
                    value={senha.atual}
                    onChange={(e) => setSenha({ ...senha, atual: e.target.value })}
                    data-cy="conta-senha-atual"
                  />
                </FormField>
                <FormField
                  id="campo-senhaNova"
                  label="Senha nova"
                  obrigatorio
                  colunas={6}
                  erro={erros.senhaNova}
                  ajuda={`8 caracteres ou mais${requisitos.tamanho ? " ✓" : ""}, com letras${
                    requisitos.letra ? " ✓" : ""
                  } e números${requisitos.numero ? " ✓" : ""}.`}
                >
                  <input
                    type="password"
                    name="senhaNova"
                    autoComplete="new-password"
                    maxLength={72}
                    value={senha.nova}
                    onChange={(e) => setSenha({ ...senha, nova: e.target.value })}
                    data-cy="conta-senha-nova"
                  />
                </FormField>
                <FormField
                  id="campo-senhaConfirmar"
                  label="Repita a senha nova"
                  obrigatorio
                  colunas={6}
                  erro={erros.senhaConfirmar}
                >
                  <input
                    type="password"
                    name="senhaConfirmar"
                    autoComplete="new-password"
                    maxLength={72}
                    value={senha.confirmar}
                    onChange={(e) => setSenha({ ...senha, confirmar: e.target.value })}
                    data-cy="conta-senha-confirmar"
                  />
                </FormField>
              </div>
              <div className="form-rodape">
                <Button
                  type="submit"
                  variante="secundario"
                  carregando={salvando === "senha"}
                  data-cy="conta-trocar-senha"
                >
                  Trocar senha
                </Button>
              </div>
            </form>
          </Card>
        </>
      )}
    </Layout>
  );
}
