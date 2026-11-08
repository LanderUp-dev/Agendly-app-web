// @requisito RO-32
import React from "react";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import "./AgendaHeader.css";

const INTERVALOS = [
  { valor: "15", rotulo: "15 min" },
  { valor: "30", rotulo: "30 min" },
  { valor: "60", rotulo: "1 h" },
];

const mesmoDia = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** Barra da agenda: navegação de data, granularidade da grade e filtros (tablet/mobile). */
interface AgendaHeaderProps {
  intervaloTempo: string;
  setIntervaloTempo: (valor: string) => void;
  dataSelecionada: Date;
  setDataSelecionada: (data: Date) => void;
  painelAberto: boolean;
  onAlternarPainel: () => void;
}

const AgendaHeader = ({
  intervaloTempo,
  setIntervaloTempo,
  dataSelecionada,
  setDataSelecionada,
  painelAberto,
  onAlternarPainel,
}: AgendaHeaderProps) => {
  const moverDias = (n: number) => {
    const d = new Date(dataSelecionada);
    d.setDate(d.getDate() + n);
    setDataSelecionada(d);
  };

  const ehHoje = mesmoDia(dataSelecionada, new Date());
  const titulo = dataSelecionada.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="agenda-barra" data-cy="agenda-barra">
      <div className="agenda-barra__data">
        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => setDataSelecionada(new Date())}
          disabled={ehHoje}
          data-cy="agenda-hoje"
        >
          Hoje
        </button>
        <div className="agenda-barra__setas">
          <button
            type="button"
            className="btn btn-fantasma btn-icone"
            onClick={() => moverDias(-1)}
            aria-label="Dia anterior"
            data-cy="agenda-anterior"
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn-fantasma btn-icone"
            onClick={() => moverDias(1)}
            aria-label="Próximo dia"
            data-cy="agenda-proximo"
          >
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <h1 className="agenda-barra__titulo" aria-live="polite" data-cy="agenda-data">
          {titulo}
        </h1>
      </div>

      <div className="agenda-barra__acoes">
        <div
          className="segmentado"
          role="radiogroup"
          aria-label="Intervalo da grade"
          data-cy="agenda-intervalo"
        >
          {INTERVALOS.map((op) => (
            <label
              key={op.valor}
              className={`segmentado__opcao ${intervaloTempo === op.valor ? "ativo" : ""}`}
            >
              <input
                type="radio"
                name="intervalo-grade"
                value={op.valor}
                checked={intervaloTempo === op.valor}
                onChange={(e) => setIntervaloTempo(e.target.value)}
                className="sr-only"
                data-cy={`intervalo-${op.valor}`}
              />
              {op.rotulo}
            </label>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-secundario agenda-barra__filtros"
          aria-expanded={painelAberto}
          aria-controls="agenda-painel"
          onClick={onAlternarPainel}
          data-cy="agenda-filtros"
        >
          <SlidersHorizontal size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>Calendário e filtros</span>
        </button>
      </div>
    </div>
  );
};

export default AgendaHeader;
