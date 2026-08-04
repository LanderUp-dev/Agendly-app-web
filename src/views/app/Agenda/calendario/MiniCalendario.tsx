// @ts-nocheck
import React, { useState } from 'react';
import './MiniCalendario.css';

const MiniCalendario = ({ dataSelecionada, setDataSelecionada }) => {
  // Estado local apenas para saber qual mês o usuário está "folheando"
  const [mesExibido, setMesExibido] = useState(new Date(dataSelecionada));

  const primeiroDiaDoMes = new Date(mesExibido.getFullYear(), mesExibido.getMonth(), 1);
  const ultimoDiaDoMes = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 0);
  const totalDias = ultimoDiaDoMes.getDate();
  const espacosVaziosInicio = primeiroDiaDoMes.getDay();

  const dias = [];
  for (let i = 0; i < espacosVaziosInicio; i++) dias.push(null);
  for (let i = 1; i <= totalDias; i++) dias.push(i);

  const mesAnterior = () => setMesExibido(new Date(mesExibido.getFullYear(), mesExibido.getMonth() - 1, 1));
  const proximoMes = () => setMesExibido(new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 1));

  const nomeDosMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="mini-calendar">
      <div className="cal-header">
        <span className="cal-month-year">
          {nomeDosMeses[mesExibido.getMonth()]} {mesExibido.getFullYear()}
        </span>
        <div className="cal-nav">
          <button onClick={mesAnterior}>&lt;</button>
          <button onClick={proximoMes}>&gt;</button>
        </div>
      </div>

      <div className="cal-weekdays">
        <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
      </div>

      <div className="cal-grid">
        {dias.map((dia, index) => {
          const hoje = new Date();
          const isHoje = dia === hoje.getDate() && 
                         mesExibido.getMonth() === hoje.getMonth() && 
                         mesExibido.getFullYear() === hoje.getFullYear();
          
          const isSelecionado = dia === dataSelecionada.getDate() && 
                                mesExibido.getMonth() === dataSelecionada.getMonth() && 
                                mesExibido.getFullYear() === dataSelecionada.getFullYear();

          return (
            <div 
              key={index} 
              className={`cal-day ${!dia ? 'empty' : ''} ${isHoje ? 'hoje' : ''} ${isSelecionado ? 'selected' : ''}`}
              onClick={() => dia && setDataSelecionada(new Date(mesExibido.getFullYear(), mesExibido.getMonth(), dia))}
            >
              {dia}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendario;