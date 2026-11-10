// @requisito RO-30 RO-31 RU-02 RU-03 RU-01 RO-32
import React, { memo, useEffect, useMemo, useRef } from "react";
import { Skeleton } from "@/components/ds";
import { estiloDoTom, tomDoServico } from "./coresAgenda";
import type { AgendamentoAgenda } from "@/services/endpoints";
import { ROTULO_STATUS } from "@/lib/statusAgendamento";
import { horaEmMinutos as emMinutos, podeMover } from "./arrastarAgenda";
import { useArrastarAgendamento } from "./useArrastarAgendamento";
import "./AgendaGrid.css";

/** Altura da linha conforme a granularidade (mais fina = linha menor). */
const ALTURA_LINHA: Record<number, number> = { 15: 32, 30: 44, 60: 64 };

/** Variáveis CSS customizadas usadas no style da grade. */
type EstiloGrade = React.CSSProperties & Record<`--${string}`, string | number>;
const HORA_INICIAL_VISIVEL = 7;
/** Altura mínima de um agendamento na tela (px): cabe uma linha com o nome. */
const ALTURA_MINIMA_EVENTO = 26;

/** Faixa do agendamento dentro da coluna: n agendamentos que se encostam ficam lado a lado. */
interface Faixa {
  faixa: number;
  faixas: number;
}

/**
 * Distribui os agendamentos de cada profissional em faixas, para nenhum ficar por cima
 * de outro. Conta a altura que o agendamento ocupa na tela (com a altura mínima), não só
 * o horário: dois de 10 minutos colados, numa grade de 1 hora, também vão lado a lado.
 */
export function calcularFaixas(
  agendamentos: AgendamentoAgenda[],
  passo: number,
  alturaLinha: number,
): Map<AgendamentoAgenda["id"], Faixa> {
  const minimoEmMinutos = (ALTURA_MINIMA_EVENTO / alturaLinha) * passo;
  const resultado = new Map<AgendamentoAgenda["id"], Faixa>();
  const porProfissional = new Map<string, AgendamentoAgenda[]>();
  for (const ag of agendamentos) {
    const lista = porProfissional.get(ag.chaveProfissional);
    if (lista) lista.push(ag);
    else porProfissional.set(ag.chaveProfissional, [ag]);
  }

  for (const lista of porProfissional.values()) {
    const ordenados = lista
      .map((ag) => {
        const ini = emMinutos(ag.horaInicio);
        return { ag, ini, fim: Math.max(emMinutos(ag.horaFim), ini + minimoEmMinutos) };
      })
      .sort((a, b) => a.ini - b.ini || b.fim - a.fim);

    let grupo: { ag: AgendamentoAgenda; faixa: number }[] = [];
    let fimDasFaixas: number[] = [];
    let fimDoGrupo = -Infinity;
    const fecharGrupo = () => {
      for (const g of grupo)
        resultado.set(g.ag.id, { faixa: g.faixa, faixas: fimDasFaixas.length });
      grupo = [];
      fimDasFaixas = [];
    };

    for (const item of ordenados) {
      if (item.ini >= fimDoGrupo) fecharGrupo();
      let faixa = fimDasFaixas.findIndex((fim) => fim <= item.ini);
      if (faixa === -1) {
        faixa = fimDasFaixas.length;
        fimDasFaixas.push(item.fim);
      } else {
        fimDasFaixas[faixa] = item.fim;
      }
      grupo.push({ ag: item.ag, faixa });
      fimDoGrupo = Math.max(fimDoGrupo, item.fim);
    }
    fecharGrupo();
  }
  return resultado;
}

const gerarHorarios = (passo: number) => {
  const horarios: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += passo) {
      horarios.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return horarios;
};

/** Grade do dia: colunas = profissionais, linhas = horários. */
interface AgendaGridProps {
  /** Chaves (ids) dos profissionais, na ordem das colunas. */
  profissionais: string[];
  /** Chave → nome mostrado no cabeçalho (dois profissionais podem ter o mesmo nome). */
  nomes?: ReadonlyMap<string, string>;
  agendamentos: AgendamentoAgenda[];
  intervalo: string;
  onCellClick: (profissional: string, hora: string) => void;
  /** Clique num agendamento existente (abre os detalhes). */
  onAgendamentoClick?: (agendamento: AgendamentoAgenda) => void;
  /** yyyy-MM-dd do dia mostrado (para não soltar em horário que já passou). */
  dataIso?: string;
  /** Pode arrastar agendamentos (AGENDAMENTO_EDITAR). */
  podeArrastar?: boolean;
  /** Soltou um agendamento em outro horário/profissional (a tela confirma). */
  onMover?: (agendamento: AgendamentoAgenda, profissional: string, hora: string) => void;
}

const SEM_NOMES: ReadonlyMap<string, string> = new Map();

const AgendaGrid = ({
  profissionais,
  nomes = SEM_NOMES,
  agendamentos,
  intervalo,
  onCellClick,
  onAgendamentoClick,
  dataIso = "",
  podeArrastar = false,
  onMover,
}: AgendaGridProps) => {
  const passo = parseInt(intervalo, 10);
  const linhas = useMemo(() => gerarHorarios(passo), [passo]);
  const altura = ALTURA_LINHA[passo] ?? 44;
  const containerRef = useRef<HTMLDivElement>(null);
  const sombraRef = useRef<HTMLDivElement>(null);
  const arrastavel = podeArrastar && !!onMover;

  const { iniciar, cliqueDoArraste } = useArrastarAgendamento({
    containerRef,
    sombraRef,
    profissionais,
    nomes,
    passo,
    alturaLinha: altura,
    dataIso,
    habilitado: arrastavel,
    onMover,
  });

  // Agendamentos agrupados por "profissional|início da linha": uma passada só,
  // em vez de filtrar a lista inteira em cada célula.
  const porCelula = useMemo(() => {
    const mapa = new Map<string, AgendamentoAgenda[]>();
    for (const ag of agendamentos) {
      const linha = Math.floor(emMinutos(ag.horaInicio) / passo) * passo;
      const chave = `${ag.chaveProfissional}|${linha}`;
      const lista = mapa.get(chave);
      if (lista) lista.push(ag);
      else mapa.set(chave, [ag]);
    }
    return mapa;
  }, [agendamentos, passo]);

  const faixas = useMemo(
    () => calcularFaixas(agendamentos, passo, altura),
    [agendamentos, passo, altura],
  );

  // Abre a grade perto do início do expediente (07:00), não à meia-noite.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = Math.max(((HORA_INICIAL_VISIVEL * 60) / passo) * altura - 16, 0);
  }, [passo, altura]);

  return (
    <div
      ref={containerRef}
      className="agenda-grade"
      role="region"
      aria-label="Agenda do dia por profissional"
      tabIndex={-1}
      style={
        {
          "--colunas": profissionais.length,
          "--altura-linha": `${altura}px`,
        } as EstiloGrade
      }
      data-cy="agenda-grade"
      data-intervalo={passo}
    >
      <div className="agenda-grade__canto" aria-hidden="true" />
      {profissionais.map((prof) => (
        <div
          key={prof}
          className="agenda-grade__profissional"
          data-cy="agenda-coluna"
          data-profissional-id={prof}
          title={nomes.get(prof) ?? prof}
        >
          <span className="agenda-grade__profissional-nome">{nomes.get(prof) ?? prof}</span>
        </div>
      ))}

      {linhas.map((hora) => {
        const cheia = hora.endsWith(":00");
        const inicioLinha = emMinutos(hora);
        return (
          <React.Fragment key={hora}>
            <div
              className={`agenda-grade__hora ${cheia ? "agenda-grade__hora--cheia" : ""}`}
              data-cy="agenda-hora"
            >
              {cheia || passo === 60 ? hora : ""}
            </div>
            {profissionais.map((prof) => {
              const eventos = porCelula.get(`${prof}|${inicioLinha}`) ?? [];
              // Horário livre: o slot é o botão "novo agendamento". Com agendamento, o botão
              // é o próprio agendamento (abre os detalhes) — evita botão dentro de botão.
              const livre = eventos.length === 0;
              return (
                <div
                  key={`${prof}-${hora}`}
                  className={`agenda-grade__slot ${cheia ? "agenda-grade__slot--cheia" : ""} ${livre ? "" : "agenda-grade__slot--ocupado"}`}
                  data-profissional={nomes.get(prof) ?? prof}
                  data-profissional-id={prof}
                  data-hora={hora}
                  {...(livre
                    ? {
                        role: "button",
                        tabIndex: 0,
                        "aria-label": `${hora} com ${nomes.get(prof) ?? prof}, livre. Enter para agendar.`,
                        onClick: () => onCellClick(prof, hora),
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onCellClick(prof, hora);
                          }
                        },
                      }
                    : {})}
                >
                  {eventos.map((ev) => {
                    // Posição em px: topo pelo minuto de início, altura pela duração real
                    // (com um mínimo de uma linha de texto); largura pela faixa.
                    const topo = ((emMinutos(ev.horaInicio) - inicioLinha) / passo) * altura;
                    const alturaEvento = Math.max(
                      ((emMinutos(ev.horaFim) - emMinutos(ev.horaInicio)) / passo) * altura,
                      ALTURA_MINIMA_EVENTO,
                    );
                    const { faixa, faixas: total } = faixas.get(ev.id) ?? { faixa: 0, faixas: 1 };
                    const status = ev.status ?? "AGENDADO";
                    const movel = arrastavel && podeMover(status);
                    return (
                      <button
                        type="button"
                        key={ev.id}
                        className={`agenda-evento agenda-evento--${status.toLowerCase()} ${movel ? "agenda-evento--movel" : ""}`}
                        onClick={() => {
                          if (!cliqueDoArraste()) onAgendamentoClick?.(ev);
                        }}
                        onPointerDown={movel ? (e) => iniciar(e, ev) : undefined}
                        aria-label={`${ev.horaInicio} a ${ev.horaFim}, ${ev.cliente || "Cliente"}, ${ev.servico || "Serviço"}, ${ROTULO_STATUS[status] ?? status}. Abrir detalhes.`}
                        data-status={status}
                        data-movel={movel ? "sim" : "nao"}
                        data-faixas={total}
                        style={{
                          top: `${topo + 1}px`,
                          height: `${alturaEvento - 2}px`,
                          left: `calc(4px + (100% - 8px) * ${faixa} / ${total})`,
                          width: `calc((100% - 8px) / ${total} - ${total > 1 ? 2 : 0}px)`,
                          ...estiloDoTom(tomDoServico(ev.servico)),
                        }}
                        title={`${ev.horaInicio}–${ev.horaFim} · ${ev.cliente} · ${ev.servico}${movel ? " · arraste para mover" : ""}`}
                        data-cy="agendamento"
                        data-id={ev.id}
                        data-data={ev.data}
                        data-inicio={ev.horaInicio}
                        data-fim={ev.horaFim}
                      >
                        <span className="agenda-evento__linha">
                          <span className="agenda-evento__cliente">{ev.cliente || "Cliente"}</span>
                          {status === "CONFIRMADO" && (
                            <span
                              className="agenda-evento__selo"
                              aria-hidden="true"
                              title="Confirmado"
                            >
                              ✓
                            </span>
                          )}
                        </span>
                        <span className="agenda-evento__detalhe">
                          <time>
                            {ev.horaInicio}–{ev.horaFim}
                          </time>{" "}
                          · {ev.servico || "Serviço"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}

      {/* Destino do arraste: movido direto no DOM, sem re-renderizar a grade. */}
      <div
        ref={sombraRef}
        className="agenda-sombra"
        aria-hidden="true"
        hidden
        data-cy="agenda-sombra"
      >
        <span className="agenda-sombra__rotulo" />
      </div>
    </div>
  );
};

/** Skeleton com a mesma estrutura da grade (cabeçalho + linhas), sem layout shift. */
export const AgendaGridSkeleton = ({ colunas = 3 }) => (
  <div
    className="agenda-grade agenda-grade--skeleton"
    style={{ "--colunas": colunas, "--altura-linha": "64px" } as EstiloGrade}
    aria-hidden="true"
  >
    <div className="agenda-grade__canto" />
    {Array.from({ length: colunas }, (_, i) => (
      <div key={i} className="agenda-grade__profissional">
        <Skeleton variante="texto" largura="45%" />
      </div>
    ))}
    {Array.from({ length: 8 }, (_, linha) => (
      <React.Fragment key={linha}>
        <div className="agenda-grade__hora agenda-grade__hora--cheia">
          <Skeleton variante="texto" largura="2.5rem" />
        </div>
        {Array.from({ length: colunas }, (_, c) => (
          <div key={c} className="agenda-grade__slot agenda-grade__slot--cheia">
            {(linha + c) % 3 === 1 && (
              <Skeleton
                altura="70%"
                style={{ position: "absolute", inset: "4px", height: "auto" }}
              />
            )}
          </div>
        ))}
      </React.Fragment>
    ))}
  </div>
);

export default memo(AgendaGrid);
