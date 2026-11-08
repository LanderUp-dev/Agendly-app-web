// @requisito RO-30 RO-31 RU-02 RU-03
import React, { useEffect, useRef } from "react";
import { Skeleton } from "@/components/ds";
import { estiloDoTom, tomDoServico } from "./coresAgenda";
import type { AgendamentoAgenda } from "@/services/endpoints";
import { ROTULO_STATUS } from "@/lib/statusAgendamento";
import "./AgendaGrid.css";

/** Altura da linha conforme a granularidade (mais fina = linha menor). */
const ALTURA_LINHA: Record<number, number> = { 15: 32, 30: 44, 60: 64 };

/** Variáveis CSS customizadas usadas no style da grade. */
type EstiloGrade = React.CSSProperties & Record<`--${string}`, string | number>;
const HORA_INICIAL_VISIVEL = 7;

const gerarHorarios = (passo: number) => {
  const horarios: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += passo) {
      horarios.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return horarios;
};

const emMinutos = (hhmm: string) => {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  return h * 60 + m;
};

/** Grade do dia: colunas = profissionais, linhas = horários. */
interface AgendaGridProps {
  profissionais: string[];
  agendamentos: AgendamentoAgenda[];
  intervalo: string;
  onCellClick: (profissional: string, hora: string) => void;
  /** Clique num agendamento existente (abre os detalhes). */
  onAgendamentoClick?: (agendamento: AgendamentoAgenda) => void;
}

const AgendaGrid = ({
  profissionais,
  agendamentos,
  intervalo,
  onCellClick,
  onAgendamentoClick,
}: AgendaGridProps) => {
  const passo = parseInt(intervalo, 10);
  const linhas = gerarHorarios(passo);
  const altura = ALTURA_LINHA[passo] ?? 44;
  const containerRef = useRef<HTMLDivElement>(null);

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
        <div key={prof} className="agenda-grade__profissional" data-cy="agenda-coluna">
          {prof}
        </div>
      ))}

      {linhas.map((hora) => {
        const cheia = hora.endsWith(":00");
        return (
          <React.Fragment key={hora}>
            <div
              className={`agenda-grade__hora ${cheia ? "agenda-grade__hora--cheia" : ""}`}
              data-cy="agenda-hora"
            >
              {cheia || passo === 60 ? hora : ""}
            </div>
            {profissionais.map((prof) => {
              const inicioLinha = emMinutos(hora);
              const eventos = agendamentos.filter((ag) => {
                const ini = emMinutos(ag.horaInicio);
                return ag.profissional === prof && ini >= inicioLinha && ini < inicioLinha + passo;
              });
              // Horário livre: o slot é o botão "novo agendamento". Com agendamento, o botão
              // é o próprio agendamento (abre os detalhes) — evita botão dentro de botão.
              const livre = eventos.length === 0;
              return (
                <div
                  key={`${prof}-${hora}`}
                  className={`agenda-grade__slot ${cheia ? "agenda-grade__slot--cheia" : ""} ${livre ? "" : "agenda-grade__slot--ocupado"}`}
                  {...(livre
                    ? {
                        role: "button",
                        tabIndex: 0,
                        "aria-label": `${hora} com ${prof}, livre. Enter para agendar.`,
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
                    const deslocamento = ((emMinutos(ev.horaInicio) - inicioLinha) / passo) * 100;
                    const duracao = Math.max(
                      ((emMinutos(ev.horaFim) - emMinutos(ev.horaInicio)) / passo) * 100,
                      60,
                    );
                    const status = ev.status ?? "AGENDADO";
                    return (
                      <button
                        type="button"
                        key={ev.id}
                        className={`agenda-evento agenda-evento--${status.toLowerCase()}`}
                        onClick={() => onAgendamentoClick?.(ev)}
                        aria-label={`${ev.horaInicio} a ${ev.horaFim}, ${ev.cliente || "Cliente"}, ${ev.servico || "Serviço"}, ${ROTULO_STATUS[status] ?? status}. Abrir detalhes.`}
                        data-status={status}
                        style={{
                          top: `${deslocamento}%`,
                          height: `calc(${duracao}% - 2px)`,
                          ...estiloDoTom(tomDoServico(ev.servico)),
                        }}
                        title={`${ev.horaInicio}–${ev.horaFim} · ${ev.cliente} · ${ev.servico}`}
                        data-cy="agendamento"
                        data-data={ev.data}
                        data-inicio={ev.horaInicio}
                        data-fim={ev.horaFim}
                      >
                        <span className="agenda-evento__cliente">{ev.cliente || "Cliente"}</span>
                        <span className="agenda-evento__detalhe">
                          <time>
                            {ev.horaInicio}–{ev.horaFim}
                          </time>{" "}
                          · {ev.servico || "Serviço"}
                        </span>
                        {status === "CONFIRMADO" && (
                          <span
                            className="agenda-evento__selo"
                            aria-hidden="true"
                            title="Confirmado"
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
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

export default AgendaGrid;
