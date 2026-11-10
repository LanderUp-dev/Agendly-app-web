import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Carregando, EmptyState, ErrorState, Skeleton } from "./Feedback";
import { Paginacao, usePaginacaoLocal } from "./Paginacao";
import type { ErroCarregamento } from "@/hooks/useCarregar";

export interface Coluna<T> {
  chave: string;
  titulo: string;
  render?: (item: T) => React.ReactNode;
  /** Coluna de identificação (destaque no mobile, sem rótulo). */
  principal?: boolean;
  /** Números/documentos com largura fixa. */
  mono?: boolean;
  alinhar?: "direita";
}

interface DataTableProps<T> {
  colunas: Coluna<T>[];
  itens: T[];
  chaveItem: (item: T) => string | number;
  carregando: boolean;
  erro: ErroCarregamento | null;
  onTentarNovamente: () => void;
  /** Texto da mensagem após 2 s, ex.: "Carregando clientes...". */
  contextoCarregando: string;
  buscaPlaceholder?: string;
  filtrar?: (item: T, termo: string) => boolean;
  vazio: { titulo: string; texto?: React.ReactNode; acao?: React.ReactNode };
  rotulo: string;
}

const LINHAS_SKELETON = 5;

/**
 * Tabela densa com busca, skeleton nas mesmas dimensões, estado vazio e
 * estado de erro com "Tentar novamente". No mobile vira lista.
 */
export function DataTable<T>({
  colunas,
  itens,
  chaveItem,
  carregando,
  erro,
  onTentarNovamente,
  contextoCarregando,
  buscaPlaceholder = "Buscar",
  filtrar,
  vazio,
  rotulo,
}: DataTableProps<T>) {
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLowerCase();

  const filtrados = useMemo(() => {
    if (!termo) return itens;
    return itens.filter((it) =>
      filtrar ? filtrar(it, termo) : JSON.stringify(it).toLowerCase().includes(termo),
    );
  }, [itens, termo, filtrar]);

  // A API devolve a lista inteira; a paginação é de exibição e lembra a página na sessão
  // (abrir um item e voltar mantém a página). Nova busca volta para a primeira.
  const { visiveis, props: paginacao } = usePaginacaoLocal(filtrados, rotulo, termo);

  const cabecalho = (
    <thead>
      <tr>
        {colunas.map((c) => (
          <th
            key={c.chave}
            scope="col"
            className={c.alinhar === "direita" ? "td-acoes" : undefined}
          >
            {c.titulo}
          </th>
        ))}
      </tr>
    </thead>
  );

  const skeleton = (
    <table className="tabela-SaaS tabela-responsiva" aria-hidden="true">
      {cabecalho}
      <tbody>
        {Array.from({ length: LINHAS_SKELETON }, (_, i) => (
          <tr key={i}>
            {colunas.map((c, j) => (
              <td key={c.chave}>
                <Skeleton variante="texto" largura={j === 0 ? "70%" : "55%"} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  let corpo: React.ReactNode;
  if (carregando) {
    corpo = (
      <Carregando
        ativo
        contexto={contextoCarregando}
        skeleton={skeleton}
        onTentarNovamente={onTentarNovamente}
      />
    );
  } else if (erro) {
    corpo = <ErrorState mensagem={erro.mensagem} onTentarNovamente={onTentarNovamente} />;
  } else if (itens.length === 0) {
    corpo = <EmptyState titulo={vazio.titulo} texto={vazio.texto} acao={vazio.acao} />;
  } else if (filtrados.length === 0) {
    corpo = (
      <EmptyState titulo="Nada encontrado" texto={`Nenhum resultado para “${busca.trim()}”.`} />
    );
  } else {
    corpo = (
      <div className="tabela-rolagem">
        <table className="tabela-SaaS tabela-responsiva" data-cy="tabela">
          <caption className="sr-only">{rotulo}</caption>
          {cabecalho}
          <tbody>
            {visiveis.map((item) => (
              <tr key={chaveItem(item)}>
                {colunas.map((c) => (
                  <td
                    key={c.chave}
                    data-rotulo={c.titulo}
                    className={
                      [
                        c.principal ? "td-principal" : "",
                        c.mono ? "td-mono" : "",
                        c.alinhar === "direita" ? "td-acoes" : "",
                      ]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                  >
                    {c.render
                      ? c.render(item)
                      : String((item as Record<string, unknown>)[c.chave] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <Paginacao rotulo={rotulo} {...paginacao} />
      </div>
    );
  }

  return (
    <div className="card card--sem-padding">
      <div className="toolbar">
        <div className="busca">
          <Search size={18} strokeWidth={1.75} aria-hidden="true" />
          <input
            type="search"
            className="campo"
            placeholder={buscaPlaceholder}
            aria-label={buscaPlaceholder}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            disabled={carregando || !!erro}
            data-cy="busca"
          />
        </div>
        {!carregando && !erro && itens.length > 0 && (
          <span className="toolbar__contagem" aria-live="polite" data-cy="contagem">
            {filtrados.length === itens.length
              ? `${itens.length} ${itens.length === 1 ? "registro" : "registros"}`
              : `${filtrados.length} de ${itens.length}`}
          </span>
        )}
      </div>
      {corpo}
    </div>
  );
}

export default DataTable;
