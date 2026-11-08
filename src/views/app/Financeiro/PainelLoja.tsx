// @requisito RO-42
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Layout } from "@/components/layout/Layout";
import { Card, Carregando, EmptyState, ErrorState, PageHeader } from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { reais } from "@/lib/dinheiro";
import { ROTULO_STATUS } from "@/lib/statusAgendamento";
import { painelService, type Painel } from "@/services/financeiro";
import "./Financeiro.css";

const iso = (d: Date) => d.toLocaleDateString("sv-SE");
const diaMes = (isoData: string) => `${isoData.slice(8, 10)}/${isoData.slice(5, 7)}`;

type Periodo = "hoje" | "7d" | "mes" | "30d" | "personalizado";

function intervalo(p: Periodo): { de: string; ate: string } {
  const hoje = new Date();
  const de = new Date(hoje);
  if (p === "7d") de.setDate(hoje.getDate() - 6);
  if (p === "30d") de.setDate(hoje.getDate() - 29);
  if (p === "mes") de.setDate(1);
  return { de: iso(de), ate: iso(hoje) };
}

const PERIODOS: { id: Periodo; rotulo: string }[] = [
  { id: "hoje", rotulo: "Hoje" },
  { id: "7d", rotulo: "7 dias" },
  { id: "mes", rotulo: "Este mês" },
  { id: "30d", rotulo: "30 dias" },
  { id: "personalizado", rotulo: "Período" },
];

/** Barra horizontal proporcional ao maior valor da tabela (magnitude, uma cor só). */
function BarraInline({ valor, maximo }: { valor: number; maximo: number }) {
  const pct = maximo > 0 ? Math.max(2, (valor / maximo) * 100) : 0;
  return (
    <span className="painel-barra" aria-hidden="true">
      <span className="painel-barra__preenchida" style={{ width: `${pct}%` }} />
    </span>
  );
}

/** Painel do dono da loja: faturamento, atendimentos, ticket médio e de onde vem o dinheiro. */
export default function PainelLoja() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [faixa, setFaixa] = useState(intervalo("mes"));
  const painel = useCarregar<Painel | null>(
    () => painelService.carregar(faixa.de, faixa.ate),
    null,
  );
  const p = painel.dados;
  const recarregarPainel = painel.recarregar;
  const primeira = useRef(true);
  useEffect(() => {
    if (primeira.current) {
      primeira.current = false;
      return;
    }
    recarregarPainel();
  }, [faixa.de, faixa.ate, recarregarPainel]);

  const escolher = (novo: Periodo) => {
    setPeriodo(novo);
    if (novo !== "personalizado") setFaixa(intervalo(novo));
  };

  const maxProf = Math.max(0, ...(p?.porProfissional.map((x) => x.valor) ?? []));
  const maxServ = Math.max(0, ...(p?.porServico.map((x) => x.valor) ?? []));
  const maxForma = Math.max(0, ...(p?.porForma.map((x) => x.valor) ?? []));
  const variosDias = (p?.porDia.length ?? 0) > 1;

  return (
    <Layout>
      <PageHeader
        titulo="Painel da loja"
        descricao="Atendimentos pagos (comandas fechadas), já com desconto e acréscimo."
      />

      <div className="painel-filtros" role="group" aria-label="Período">
        {PERIODOS.map((x) => (
          <button
            key={x.id}
            type="button"
            className={`painel-filtro ${periodo === x.id ? "painel-filtro--ativo" : ""}`}
            aria-pressed={periodo === x.id}
            onClick={() => escolher(x.id)}
            data-cy={`painel-periodo-${x.id}`}
          >
            {x.rotulo}
          </button>
        ))}
        {periodo === "personalizado" && (
          <span className="painel-datas">
            <input
              type="date"
              className="campo"
              aria-label="Data inicial"
              value={faixa.de}
              max={faixa.ate}
              onChange={(e) => e.target.value && setFaixa((f) => ({ ...f, de: e.target.value }))}
            />
            <span aria-hidden="true">até</span>
            <input
              type="date"
              className="campo"
              aria-label="Data final"
              value={faixa.ate}
              min={faixa.de}
              onChange={(e) => e.target.value && setFaixa((f) => ({ ...f, ate: e.target.value }))}
            />
          </span>
        )}
      </div>

      {painel.carregando && <Carregando ativo contexto="Calculando..." />}
      {!painel.carregando && painel.erro && (
        <ErrorState mensagem={painel.erro.mensagem} onTentarNovamente={painel.recarregar} />
      )}

      {p && !painel.carregando && (
        <>
          <section
            className="financeiro-indicadores"
            aria-label="Indicadores"
            data-cy="painel-indicadores"
          >
            <Card>
              <p className="financeiro-indicador__rotulo">Faturamento</p>
              <p className="financeiro-indicador__valor" data-cy="painel-faturamento">
                {reais(p.faturamento)}
              </p>
              {p.descontos > 0 && (
                <p className="texto-ajuda">Descontos dados: {reais(p.descontos)}</p>
              )}
            </Card>
            <Card>
              <p className="financeiro-indicador__rotulo">Atendimentos</p>
              <p className="financeiro-indicador__valor" data-cy="painel-atendimentos">
                {p.atendimentos}
              </p>
              <p className="texto-ajuda">{p.clientesAtendidos} cliente(s) diferentes</p>
            </Card>
            <Card>
              <p className="financeiro-indicador__rotulo">Ticket médio</p>
              <p className="financeiro-indicador__valor" data-cy="painel-ticket">
                {reais(p.ticketMedio)}
              </p>
            </Card>
            <Card>
              <p className="financeiro-indicador__rotulo">Faltas</p>
              <p className="financeiro-indicador__valor" data-cy="painel-faltas">
                {p.taxaFaltas.toLocaleString("pt-BR")}%
              </p>
              <p className="texto-ajuda">
                {p.agendamentosPorStatus.NAO_COMPARECEU ?? 0} de{" "}
                {p.agendamentos - (p.agendamentosPorStatus.CANCELADO ?? 0)} agendamentos
              </p>
            </Card>
          </section>

          {p.atendimentos === 0 ? (
            <EmptyState
              titulo="Nenhum atendimento pago no período"
              texto="Feche os atendimentos na agenda (com o caixa aberto) para eles aparecerem aqui."
            />
          ) : (
            <>
              {variosDias && (
                <Card como="section" className="financeiro-secao">
                  <h2 className="financeiro-secao__titulo">Faturamento por dia</h2>
                  <div className="painel-grafico" data-cy="painel-grafico">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart
                        data={p.porDia}
                        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                        barCategoryGap={2}
                      >
                        <CartesianGrid vertical={false} stroke="var(--borda-sutil)" />
                        <XAxis
                          dataKey="data"
                          tickFormatter={diaMes}
                          tick={{ fill: "var(--texto-secundario)", fontSize: 12 }}
                          axisLine={{ stroke: "var(--borda-forte)" }}
                          tickLine={false}
                          minTickGap={16}
                        />
                        <YAxis
                          tickFormatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                          tick={{ fill: "var(--texto-secundario)", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={72}
                        />
                        <Tooltip
                          cursor={{ fill: "var(--fundo-hover)" }}
                          contentStyle={{
                            background: "var(--fundo-elevado)",
                            border: "1px solid var(--borda-sutil)",
                            borderRadius: 8,
                            color: "var(--texto-principal)",
                          }}
                          labelFormatter={(d: string) => diaMes(d)}
                          formatter={(v: number, _n, item) => [
                            `${reais(v)} · ${item.payload.atendimentos} atendimento(s)`,
                            "Faturamento",
                          ]}
                        />
                        <Bar
                          dataKey="faturamento"
                          fill="var(--marca)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={28}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <details className="painel-tabela-dias">
                    <summary>Ver como tabela</summary>
                    <table className="tabela-SaaS">
                      <thead>
                        <tr>
                          <th scope="col">Dia</th>
                          <th scope="col" className="tabela__num">
                            Atendimentos
                          </th>
                          <th scope="col" className="tabela__num">
                            Faturamento
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.porDia.map((d) => (
                          <tr key={d.data}>
                            <td>{diaMes(d.data)}</td>
                            <td className="tabela__num">{d.atendimentos}</td>
                            <td className="tabela__num">{reais(d.faturamento)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </Card>
              )}

              <div className="painel-colunas">
                <Card como="section" className="financeiro-secao">
                  <h2 className="financeiro-secao__titulo">Por profissional</h2>
                  <table className="tabela-SaaS painel-tabela" data-cy="painel-profissionais">
                    <thead>
                      <tr>
                        <th scope="col">Profissional</th>
                        <th scope="col" className="tabela__num">
                          Serviços
                        </th>
                        <th scope="col" className="tabela__num">
                          Valor
                        </th>
                        <th
                          scope="col"
                          className="tabela__num"
                          title="Estimativa: valor menos a comissão da loja"
                        >
                          Parte do profissional*
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.porProfissional.map((x) => (
                        <tr key={x.idFuncionario}>
                          <td>
                            {x.nome}
                            <BarraInline valor={x.valor} maximo={maxProf} />
                          </td>
                          <td className="tabela__num">{x.servicos}</td>
                          <td className="tabela__num">{reais(x.valor)}</td>
                          <td className="tabela__num">{reais(x.parteProfissional)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="texto-ajuda">
                    * Valor do serviço menos a comissão da loja cadastrada no serviço. Estimativa
                    até o módulo de salário existir.
                  </p>
                </Card>

                <Card como="section" className="financeiro-secao">
                  <h2 className="financeiro-secao__titulo">Serviços mais vendidos</h2>
                  <table className="tabela-SaaS painel-tabela" data-cy="painel-servicos">
                    <thead>
                      <tr>
                        <th scope="col">Serviço</th>
                        <th scope="col" className="tabela__num">
                          Qtd.
                        </th>
                        <th scope="col" className="tabela__num">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.porServico.slice(0, 10).map((x) => (
                        <tr key={x.idServico}>
                          <td>
                            {x.nome}
                            <BarraInline valor={x.valor} maximo={maxServ} />
                          </td>
                          <td className="tabela__num">{x.quantidade}</td>
                          <td className="tabela__num">{reais(x.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card como="section" className="financeiro-secao">
                  <h2 className="financeiro-secao__titulo">Formas de pagamento</h2>
                  <table className="tabela-SaaS painel-tabela" data-cy="painel-formas">
                    <thead>
                      <tr>
                        <th scope="col">Forma</th>
                        <th scope="col" className="tabela__num">
                          Valor
                        </th>
                        <th scope="col" className="tabela__num">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.porForma.map((x) => (
                        <tr key={x.forma}>
                          <td>
                            {x.descricao}
                            <BarraInline valor={x.valor} maximo={maxForma} />
                          </td>
                          <td className="tabela__num">{reais(x.valor)}</td>
                          <td className="tabela__num">
                            {p.faturamento > 0
                              ? `${Math.round((x.valor / p.faturamento) * 100)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card como="section" className="financeiro-secao">
                  <h2 className="financeiro-secao__titulo">Agendamentos do período</h2>
                  <table className="tabela-SaaS painel-tabela" data-cy="painel-status">
                    <tbody>
                      {Object.entries(p.agendamentosPorStatus).map(([s, n]) => (
                        <tr key={s}>
                          <td>{ROTULO_STATUS[s] ?? s}</td>
                          <td className="tabela__num">{n}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </Layout>
  );
}
