import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./MiniCalendario.css";

interface MiniCalendarioProps {
  dataSelecionada: Date;
  setDataSelecionada: (data: Date) => void;
}

const MiniCalendario = ({ dataSelecionada, setDataSelecionada }: MiniCalendarioProps) => {
  // Estado local apenas para saber qual mês o usuário está "folheando"
  const [mesExibido, setMesExibido] = useState(new Date(dataSelecionada));

  const primeiroDiaDoMes = new Date(mesExibido.getFullYear(), mesExibido.getMonth(), 1);
  const ultimoDiaDoMes = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 0);
  const totalDias = ultimoDiaDoMes.getDate();
  const espacosVaziosInicio = primeiroDiaDoMes.getDay();

  const dias = [];
  for (let i = 0; i < espacosVaziosInicio; i++) dias.push(null);
  for (let i = 1; i <= totalDias; i++) dias.push(i);

  const mesAnterior = () =>
    setMesExibido(new Date(mesExibido.getFullYear(), mesExibido.getMonth() - 1, 1));
  const proximoMes = () =>
    setMesExibido(new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 1));

  const nomeDosMeses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return (
    <div className="mini-calendar" data-cy="mini-calendario">
      <div className="cal-header">
        <span className="cal-month-year" aria-live="polite">
          {nomeDosMeses[mesExibido.getMonth()]} {mesExibido.getFullYear()}
        </span>
        <div className="cal-nav">
          <button type="button" onClick={mesAnterior} aria-label="Mês anterior">
            <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button type="button" onClick={proximoMes} aria-label="Próximo mês">
            <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="cal-weekdays" aria-hidden="true">
        <span>D</span>
        <span>S</span>
        <span>T</span>
        <span>Q</span>
        <span>Q</span>
        <span>S</span>
        <span>S</span>
      </div>

      <div className="cal-grid">
        {dias.map((dia, index) => {
          const hoje = new Date();
          const isHoje =
            dia === hoje.getDate() &&
            mesExibido.getMonth() === hoje.getMonth() &&
            mesExibido.getFullYear() === hoje.getFullYear();

          const isSelecionado =
            dia === dataSelecionada.getDate() &&
            mesExibido.getMonth() === dataSelecionada.getMonth() &&
            mesExibido.getFullYear() === dataSelecionada.getFullYear();

          if (!dia) return <span key={index} className="cal-day empty" aria-hidden="true" />;

          const dataDia = new Date(mesExibido.getFullYear(), mesExibido.getMonth(), dia);
          return (
            <button
              type="button"
              key={index}
              className={`cal-day ${isHoje ? "hoje" : ""} ${isSelecionado ? "selected" : ""}`}
              onClick={() => setDataSelecionada(dataDia)}
              aria-label={dataDia.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
              aria-pressed={isSelecionado}
              aria-current={isHoje ? "date" : undefined}
            >
              {dia}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendario;
