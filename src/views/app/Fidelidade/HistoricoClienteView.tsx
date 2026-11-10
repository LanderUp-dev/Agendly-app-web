// @requisito RO-04 RO-26 RND-04 RND-05
import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import {
  Badge,
  Button,
  Card,
  Carregando,
  EmptyState,
  ErrorState,
  PageHeader,
  Paginacao,
} from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { reais } from "@/lib/dinheiro";
import { descricaoForma } from "@/services/financeiro";
import { fidelidadeService, type HistoricoCliente } from "@/services/fidelidade";
import { percentualCiclo, textoFaltam } from "./fidelidadeUtil";
import "./Fidelidade.css";

const TAMANHO = 10;

const data = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** Histórico do cliente: visitas (comandas fechadas), gastos, progresso da fidelidade e comandas. */
export default function HistoricoClienteView({ id }: { id: number }) {
  const [pagina, setPagina] = useState(0);
  const historico = useCarregar<HistoricoCliente | null>(
    () => (id > 0 ? fidelidadeService.historico(id, pagina, TAMANHO) : Promise.resolve(null)),
    null,
  );

  const recarregar = historico.recarregar;
  const carregado = useRef({ id, pagina });
  useEffect(() => {
    if (carregado.current.id === id && carregado.current.pagina === pagina) return;
    carregado.current = { id, pagina };
    recarregar();
  }, [id, pagina, recarregar]);

  const h = historico.dados;
  const fid = h?.fidelidade;

  return (
    <Layout>
      <PageHeader
        titulo={h ? `Histórico de ${h.nome}` : "Histórico do cliente"}
        descricao="Atendimentos fechados (cada um conta como uma visita)."
        voltar={{ to: "/listagem-clientes", rotulo: "Clientes" }}
      />

      {historico.carregando && !h && <Carregando ativo contexto="Carregando o histórico..." />}
      {!historico.carregando && historico.erro && (
        <ErrorState mensagem={historico.erro.mensagem} onTentarNovamente={historico.recarregar} />
      )}
      {!historico.carregando && !historico.erro && !h && (
        <EmptyState
          titulo="Cliente não encontrado"
          texto="Volte à lista de clientes e tente de novo."
        />
      )}

      {h && (
        <>
          <section
            className="fidelidade-indicadores"
            aria-label="Resumo do cliente"
            data-cy="historico-resumo"
          >
            <Card>
              <p className="fidelidade-indicador__rotulo">Visitas</p>
              <p className="fidelidade-indicador__valor" data-cy="historico-visitas">
                {h.visitas}
              </p>
              <p className="texto-ajuda">Última: {data(h.ultimaVisita)}</p>
            </Card>
            <Card>
              <p className="fidelidade-indicador__rotulo">Total gasto</p>
              <p className="fidelidade-indicador__valor" data-cy="historico-total">
                {reais(h.totalGasto)}
              </p>
              <p className="texto-ajuda">Ticket médio {reais(h.ticketMedio)}</p>
            </Card>
            <Card>
              <p className="fidelidade-indicador__rotulo">Fidelidade</p>
              {fid?.ativo ? (
                <div data-cy="historico-fidelidade">
                  <div
                    className="fidelidade-barra"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={fid.n}
                    aria-valuenow={fid.noCiclo}
                    aria-label={`${fid.noCiclo} de ${fid.n} visitas`}
                  >
                    <span style={{ width: `${percentualCiclo(fid)}%` }} />
                  </div>
                  <p className="fidelidade-barra__texto">
                    {fid.noCiclo} de {fid.n} · {textoFaltam(fid)}
                  </p>
                  {fid.recompensasCompletas > 0 && (
                    <p className="texto-ajuda" data-cy="historico-recompensas">
                      Já ganhou {fid.recompensasCompletas}{" "}
                      {fid.recompensasCompletas === 1 ? "recompensa" : "recompensas"}.
                    </p>
                  )}
                </div>
              ) : (
                <p className="texto-ajuda" data-cy="historico-fidelidade-inativa">
                  <Badge>Programa desligado</Badge>
                </p>
              )}
            </Card>
          </section>

          <Card como="section" className="fidelidade-secao">
            <h2 className="fidelidade-titulo">Atendimentos</h2>
            {h.comandas.totalElements === 0 ? (
              <p className="texto-ajuda">Nenhum atendimento fechado ainda.</p>
            ) : (
              <>
                <div className="tabela-container">
                  <table className="tabela-SaaS" data-cy="historico-comandas">
                    <thead>
                      <tr>
                        <th scope="col">Data</th>
                        <th scope="col">Serviços</th>
                        <th scope="col">Profissional</th>
                        <th scope="col">Pagamento</th>
                        <th scope="col" className="tabela__num">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {h.comandas.itens.map((c) => (
                        <tr key={c.id}>
                          <td>{data(c.data)}</td>
                          <td>{c.servicos.join(", ")}</td>
                          <td>{c.profissionais.join(", ")}</td>
                          <td>{c.formasPagamento.map(descricaoForma).join(" + ")}</td>
                          <td className="tabela__num">{reais(c.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Paginacao
                  rotulo="Histórico do cliente"
                  pagina={h.comandas.page + 1}
                  totalPaginas={h.comandas.totalPages}
                  totalItens={h.comandas.totalElements}
                  porPagina={h.comandas.size}
                  onMudar={(p) => setPagina(p - 1)}
                  desabilitado={historico.carregando}
                />
              </>
            )}
          </Card>
        </>
      )}
    </Layout>
  );
}
