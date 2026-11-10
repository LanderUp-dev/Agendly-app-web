// @requisito RE-15 RE-16 RO-29
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Layout } from "@/components/layout/Layout";
import {
  Badge,
  Button,
  Carregando,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
} from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { temPermissao, type Permissao } from "@/lib/permissoes";
import {
  agruparPermissoes,
  cargosService,
  type Cargo,
  type PermissaoCatalogo,
} from "@/services/cargos";
import "../Financeiro/Financeiro.css";
import "./Cargos.css";

const TAMANHO_NOME = 60;

const mensagemDaApi = (err: unknown) => {
  const dados = isAxiosError(err) ? err.response?.data : undefined;
  return typeof dados === "string" && dados.length < 400 ? dados : "";
};

const usuarioTem = (chave: string) => temPermissao(chave as Permissao);

interface Form {
  nome: string;
  descricao: string;
  permissoes: string[];
}

const FORM_VAZIO: Form = { nome: "", descricao: "", permissoes: [] };

/**
 * Cargos da loja (RO-29): os do sistema (GERENTE, COLABORADOR) só podem ser vistos e duplicados;
 * os da loja podem ser criados, editados e excluídos. O backend barra conceder permissão que o
 * usuário não tem; aqui essas caixas aparecem desabilitadas, com a explicação.
 */
export default function CargosView() {
  const podeGerenciar = temPermissao("CARGO_GERENCIAR");
  const lista = useCarregar<Cargo[]>(() => cargosService.listar(), []);
  const catalogo = useCarregar<PermissaoCatalogo[]>(() => cargosService.catalogo(), []);
  const grupos = useMemo(() => agruparPermissoes(catalogo.dados), [catalogo.dados]);

  const [aberto, setAberto] = useState(false);
  const [cargo, setCargo] = useState<Cargo | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [duplicando, setDuplicando] = useState<number | null>(null);

  const somenteLeitura = !podeGerenciar || !!cargo?.doSistema;

  const abrir = (c: Cargo | null) => {
    setCargo(c);
    setForm(
      c
        ? { nome: c.nome, descricao: c.descricao ?? "", permissoes: [...c.permissoes] }
        : FORM_VAZIO,
    );
    setErro("");
    setAberto(true);
  };

  const alternar = (chave: string) =>
    setForm((f) => ({
      ...f,
      permissoes: f.permissoes.includes(chave)
        ? f.permissoes.filter((p) => p !== chave)
        : [...f.permissoes, chave],
    }));

  /** Marca/desmarca as do grupo que o usuário pode conceder; as outras ficam como estão. */
  const alternarGrupo = (chaves: string[], marcar: boolean) =>
    setForm((f) => {
      const alteraveis = chaves.filter(usuarioTem);
      const resto = f.permissoes.filter((p) => !alteraveis.includes(p));
      return { ...f, permissoes: marcar ? [...resto, ...alteraveis] : resto };
    });

  const salvar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (somenteLeitura) return;
    const nome = form.nome.trim().replace(/\s+/g, " ");
    if (!nome) {
      setErro("Informe o nome do cargo.");
      document.getElementById("cargo-nome")?.focus();
      return;
    }
    if (nome.length > TAMANHO_NOME) {
      setErro(`O nome do cargo pode ter no máximo ${TAMANHO_NOME} caracteres.`);
      document.getElementById("cargo-nome")?.focus();
      return;
    }
    setSalvando(true);
    setErro("");
    const dados = {
      nome,
      descricao: form.descricao.trim() || undefined,
      permissoes: form.permissoes,
    };
    try {
      if (cargo) {
        await cargosService.editar(cargo.id, dados);
        toast.success("Cargo atualizado.");
      } else {
        await cargosService.criar(dados);
        toast.success("Cargo criado.");
      }
      setAberto(false);
      lista.recarregar();
    } catch (err) {
      setErro(mensagemDaApi(err) || "Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const duplicar = async (c: Cargo) => {
    setDuplicando(c.id);
    try {
      const copia = await cargosService.duplicar(c.id);
      toast.success(`Cargo "${copia.nome}" criado. Ajuste o nome e as permissões.`);
      lista.recarregar();
      abrir(copia);
    } catch {
      // mensagem pelo interceptor (ex.: permissões que você não tem)
    } finally {
      setDuplicando(null);
    }
  };

  const excluir = async (c: Cargo) => {
    if (c.pessoas > 0) {
      toast.error(
        `"${c.nome}" é usado por ${c.pessoas} ${c.pessoas === 1 ? "pessoa" : "pessoas"}. ` +
          "Mude o cargo delas na tela Equipes antes de excluir.",
      );
      return;
    }
    if (!window.confirm(`Excluir o cargo "${c.nome}"? Não dá para desfazer.`)) return;
    try {
      await cargosService.excluir(c.id);
      toast.success("Cargo excluído.");
      lista.recarregar();
    } catch {
      // mensagem pelo interceptor
    }
  };

  const totalPermissoes = catalogo.dados.length;
  const carregando = lista.carregando || catalogo.carregando;
  const erroCarga = lista.erro ?? catalogo.erro;

  return (
    <Layout>
      <PageHeader
        titulo="Cargos"
        descricao="O que cada cargo pode fazer nesta loja. Os cargos padrão não mudam: duplique para criar um parecido."
        acoes={
          podeGerenciar && (
            <Button onClick={() => abrir(null)} data-cy="cargo-novo">
              Novo cargo
            </Button>
          )
        }
      />

      <p className="cargos-aviso" data-cy="cargo-aviso-vigencia">
        As mudanças valem para cada pessoa no próximo acesso à loja.
      </p>

      {carregando && <Carregando ativo contexto="Carregando os cargos..." />}
      {!carregando && erroCarga && (
        <ErrorState
          mensagem={erroCarga.mensagem}
          onTentarNovamente={() => {
            lista.recarregar();
            catalogo.recarregar();
          }}
        />
      )}
      {!carregando && !erroCarga && lista.dados.length === 0 && (
        <EmptyState titulo="Nenhum cargo encontrado" texto="Recarregue a página." />
      )}
      {!carregando && !erroCarga && lista.dados.length > 0 && (
        <div className="tabela-container">
          <table className="tabela-SaaS" data-cy="cargo-lista">
            <thead>
              <tr>
                <th scope="col">Cargo</th>
                <th scope="col" className="tabela__num">
                  Permissões
                </th>
                <th scope="col" className="tabela__num">
                  Pessoas
                </th>
                <th scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lista.dados.map((c) => (
                <tr key={c.id} data-cy="cargo-linha" data-cargo={c.nome}>
                  <td>
                    <strong data-cy="cargo-nome-linha">{c.nome}</strong>{" "}
                    {c.doSistema && <Badge tom="marca">Padrão</Badge>}
                    {c.descricao && <div className="texto-ajuda">{c.descricao}</div>}
                  </td>
                  <td className="tabela__num" data-cy="cargo-qtd-permissoes">
                    {c.permissoes.length}
                    {totalPermissoes > 0 && ` de ${totalPermissoes}`}
                  </td>
                  <td className="tabela__num" data-cy="cargo-pessoas">
                    {c.pessoas}
                  </td>
                  <td>
                    <div className="cargos-acoes">
                      <button
                        type="button"
                        className="link financeiro-link-botao"
                        onClick={() => abrir(c)}
                        data-cy={c.doSistema || !podeGerenciar ? "cargo-ver" : "cargo-editar"}
                      >
                        {c.doSistema || !podeGerenciar ? "Ver permissões" : "Editar"}
                      </button>
                      {podeGerenciar && (
                        <button
                          type="button"
                          className="link financeiro-link-botao"
                          onClick={() => duplicar(c)}
                          disabled={duplicando !== null}
                          aria-busy={duplicando === c.id}
                          data-cy="cargo-duplicar"
                        >
                          {duplicando === c.id ? "Duplicando…" : "Duplicar"}
                        </button>
                      )}
                      {podeGerenciar && !c.doSistema && (
                        <button
                          type="button"
                          className="link financeiro-link-botao financeiro-saida"
                          onClick={() => excluir(c)}
                          data-cy="cargo-excluir"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        titulo={
          cargo
            ? somenteLeitura
              ? `Cargo ${cargo.nome}`
              : `Editar cargo ${cargo.nome}`
            : "Novo cargo"
        }
        aberto={aberto}
        onFechar={() => setAberto(false)}
        data-cy="modal-cargo"
        rodape={
          <>
            <Button variante="secundario" onClick={() => setAberto(false)} data-cy="cargo-voltar">
              {somenteLeitura ? "Fechar" : "Voltar"}
            </Button>
            {!somenteLeitura && (
              <Button
                type="submit"
                form="form-cargo"
                carregando={salvando}
                textoCarregando="Salvando…"
                data-cy="cargo-salvar"
              >
                Salvar
              </Button>
            )}
          </>
        }
      >
        <form id="form-cargo" onSubmit={salvar} noValidate className="financeiro-form">
          {cargo?.doSistema && (
            <p className="texto-ajuda" data-cy="cargo-somente-leitura">
              Cargo padrão do sistema: não pode ser alterado. Use “Duplicar” para criar uma cópia
              que você pode mudar.
            </p>
          )}
          {erro && (
            <div className="alerta alerta-erro" role="alert" data-cy="cargo-erro">
              {erro}
            </div>
          )}
          <div className="campo-wrapper">
            <label htmlFor="cargo-nome">Nome *</label>
            <input
              id="cargo-nome"
              name="nome"
              autoComplete="off"
              value={form.nome}
              maxLength={TAMANHO_NOME}
              required
              readOnly={somenteLeitura}
              aria-invalid={erro.includes("nome") || undefined}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Recepcionista…"
              data-cy="cargo-nome"
            />
          </div>
          <div className="campo-wrapper">
            <label htmlFor="cargo-descricao">Descrição</label>
            <input
              id="cargo-descricao"
              name="descricao"
              autoComplete="off"
              value={form.descricao}
              maxLength={255}
              readOnly={somenteLeitura}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex.: Atende o balcão e marca horários…"
              data-cy="cargo-descricao"
            />
          </div>

          {!somenteLeitura && (
            <p className="texto-ajuda" id="cargo-explica-desabilitada">
              Você só pode dar permissões que o seu cargo tem nesta loja. As que você não tem
              aparecem desabilitadas.
            </p>
          )}

          <div className="cargos-grupos" data-cy="cargo-permissoes">
            {grupos.map((g) => {
              const chaves = g.permissoes.map((p) => p.chave);
              const alteraveis = chaves.filter(usuarioTem);
              const marcadas = alteraveis.filter((c) => form.permissoes.includes(c));
              const todas = alteraveis.length > 0 && marcadas.length === alteraveis.length;
              const algumas = marcadas.length > 0 && !todas;
              const idGrupo = `cargo-grupo-${g.area.replace(/\W+/g, "-")}`;
              return (
                <fieldset key={g.area} className="cargos-grupo" data-cy="cargo-grupo">
                  <legend>{g.area}</legend>
                  {!somenteLeitura && alteraveis.length > 1 && (
                    <label className="opcao-inline cargos-grupo__todas">
                      <input
                        type="checkbox"
                        id={idGrupo}
                        checked={todas}
                        ref={(el) => {
                          if (el) el.indeterminate = algumas;
                        }}
                        onChange={() => alternarGrupo(chaves, !todas)}
                        data-cy="cargo-marcar-grupo"
                      />
                      Marcar todas do grupo
                    </label>
                  )}
                  {g.permissoes.map((p) => {
                    const pode = usuarioTem(p.chave);
                    const desabilitada = somenteLeitura || !pode;
                    return (
                      <label
                        key={p.chave}
                        className={`opcao-inline cargos-permissao ${desabilitada ? "cargos-permissao--off" : ""}`}
                      >
                        <input
                          type="checkbox"
                          name="permissoes"
                          value={p.chave}
                          checked={form.permissoes.includes(p.chave)}
                          disabled={desabilitada}
                          aria-describedby={
                            !somenteLeitura && !pode ? "cargo-explica-desabilitada" : undefined
                          }
                          onChange={() => alternar(p.chave)}
                          data-cy={`cargo-permissao-${p.chave}`}
                        />
                        <span>
                          {p.descricao}
                          {!somenteLeitura && !pode && (
                            <span className="texto-ajuda cargos-permissao__motivo">
                              {" "}
                              — seu cargo não tem esta permissão
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              );
            })}
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
