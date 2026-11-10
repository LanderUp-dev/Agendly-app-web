import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Paginação única do app: "1–20 de 57", páginas numeradas (com reticências quando são
 * muitas), anterior/próxima e a escolha de quantos itens por página.
 * Serve para lista paginada no front (usePaginacaoLocal) e para página vinda da API.
 * Páginas contadas a partir de 1.
 */
export interface PaginacaoProps {
  pagina: number;
  totalPaginas: number;
  /** Total de itens (para o "1–20 de 57"); sem ele, mostra só "Página x de y". */
  totalItens?: number;
  porPagina?: number;
  onMudar: (pagina: number) => void;
  /** Mostra a escolha de itens por página quando informado. */
  onMudarPorPagina?: (porPagina: number) => void;
  opcoesPorPagina?: number[];
  /** Nome da lista, para o leitor de tela ("Páginas de Clientes"). */
  rotulo: string;
  desabilitado?: boolean;
}

export const OPCOES_POR_PAGINA = [10, 20, 50];

/** Números a mostrar: primeira, última, a atual e vizinhas; "…" no lugar dos saltos. */
export function paginasVisiveis(atual: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const meio = [atual - 1, atual, atual + 1].filter((p) => p > 1 && p < total);
  if (atual <= 3) meio.push(2, 3, 4);
  if (atual >= total - 2) meio.push(total - 3, total - 2, total - 1);
  const unicos = [...new Set([1, ...meio, total])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const resultado: (number | "…")[] = [];
  unicos.forEach((p, i) => {
    if (i > 0 && p - unicos[i - 1] > 1) resultado.push("…");
    resultado.push(p);
  });
  return resultado;
}

export function Paginacao({
  pagina,
  totalPaginas,
  totalItens,
  porPagina,
  onMudar,
  onMudarPorPagina,
  opcoesPorPagina = OPCOES_POR_PAGINA,
  rotulo,
  desabilitado = false,
}: PaginacaoProps) {
  const mostrarEscolha =
    !!onMudarPorPagina && totalItens !== undefined && totalItens > opcoesPorPagina[0];
  if (totalPaginas <= 1 && !mostrarEscolha) return null;

  const inicio = totalItens !== undefined && porPagina ? (pagina - 1) * porPagina + 1 : 0;
  const fim = totalItens !== undefined && porPagina ? Math.min(pagina * porPagina, totalItens) : 0;

  return (
    <nav className="paginacao" aria-label={`Páginas de ${rotulo}`} data-cy="paginacao">
      <span className="paginacao__info" aria-live="polite">
        {totalItens !== undefined && porPagina
          ? `${inicio}–${fim} de ${totalItens}`
          : `Página ${pagina} de ${totalPaginas}`}
      </span>

      {totalPaginas > 1 && (
        <div className="paginacao__botoes">
          <button
            type="button"
            className="btn btn-secundario btn-icone"
            onClick={() => onMudar(pagina - 1)}
            disabled={desabilitado || pagina <= 1}
            aria-label="Página anterior"
            data-cy="pagina-anterior"
          >
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <ol className="paginacao__numeros">
            {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
              p === "…" ? (
                <li key={`salto-${i}`} className="paginacao__salto" aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={p}>
                  <button
                    type="button"
                    className={`paginacao__numero ${p === pagina ? "ativo" : ""}`}
                    onClick={() => onMudar(p)}
                    disabled={desabilitado}
                    aria-label={`Página ${p}`}
                    aria-current={p === pagina ? "page" : undefined}
                    data-cy="pagina-numero"
                  >
                    {p}
                  </button>
                </li>
              ),
            )}
          </ol>
          <span className="paginacao__atual">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            className="btn btn-secundario btn-icone"
            onClick={() => onMudar(pagina + 1)}
            disabled={desabilitado || pagina >= totalPaginas}
            aria-label="Próxima página"
            data-cy="pagina-proxima"
          >
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}

      {mostrarEscolha && porPagina && (
        <label className="paginacao__por-pagina">
          Por página
          <select
            className="campo"
            value={porPagina}
            onChange={(e) => onMudarPorPagina?.(Number(e.target.value))}
            disabled={desabilitado}
            data-cy="por-pagina"
          >
            {opcoesPorPagina.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
    </nav>
  );
}

function lerSessao(chave: string): { pagina?: number; porPagina?: number } {
  try {
    return JSON.parse(sessionStorage.getItem(`paginacao:${chave}`) ?? "{}");
  } catch {
    return {};
  }
}

/**
 * Paginação de uma lista que já veio inteira da API. Guarda a página e o tamanho na
 * sessão do navegador: quem abre um item para editar e volta cai na mesma página.
 * `reiniciarCom` (ex.: o termo da busca) volta para a página 1 quando muda.
 */
export function usePaginacaoLocal<T>(
  itens: T[],
  chave: string,
  reiniciarCom: unknown = null,
  porPaginaPadrao = 20,
) {
  const salvo = useMemo(() => lerSessao(chave), [chave]);
  const [pagina, setPagina] = useState(salvo.pagina ?? 1);
  const [porPagina, setPorPagina] = useState(salvo.porPagina ?? porPaginaPadrao);
  const [reinicio, setReinicio] = useState(reiniciarCom);

  if (reinicio !== reiniciarCom) {
    setReinicio(reiniciarCom);
    setPagina(1);
  }

  const totalPaginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const paginaAtual = Math.min(Math.max(pagina, 1), totalPaginas);
  const inicio = (paginaAtual - 1) * porPagina;
  const visiveis = useMemo(
    () => itens.slice(inicio, inicio + porPagina),
    [itens, inicio, porPagina],
  );

  useEffect(() => {
    try {
      sessionStorage.setItem(
        `paginacao:${chave}`,
        JSON.stringify({ pagina: paginaAtual, porPagina }),
      );
    } catch {
      /* sessão indisponível: só não lembra a página */
    }
  }, [chave, paginaAtual, porPagina]);

  return {
    visiveis,
    props: {
      pagina: paginaAtual,
      totalPaginas,
      totalItens: itens.length,
      porPagina,
      onMudar: setPagina,
      onMudarPorPagina: (n: number) => {
        setPorPagina(n);
        setPagina(1);
      },
    },
  };
}

export default Paginacao;
