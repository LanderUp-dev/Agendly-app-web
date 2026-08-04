// @ts-nocheck
import React from 'react';
import './AgendaGrid.css';

const AgendaGrid = ({ profissionais, agendamentos, intervalo, onCellClick }) => {
  
  const gerarHorarios = () => {
    const horarios = [];
    // Forçamos a visualização da grade a ser sempre de 1h para o design ficar limpo
    // ou usamos o 'intervalo' vindo do Header se quiser mudar a grade inteira.
    const step = parseInt(intervalo); 
    
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += step) {
        horarios.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return horarios;
  };

  const linhasDeTempo = gerarHorarios();

  // Função para calcular o deslocamento (TOP) e a altura (HEIGHT)
  const calcularPosicaoCard = (horaInicioEvento, horaFimEvento, horaDaLinha) => {
    const [hInicio, mInicio] = horaInicioEvento.split(':').map(Number);
    const [hFim, mFim] = horaFimEvento.split(':').map(Number);
    const [hLinha, mLinha] = horaDaLinha.split(':').map(Number);

    // Calculamos a diferença em minutos do início do evento para o início da célula
    const diffMinutosTop = (hInicio * 60 + mInicio) - (hLinha * 60 + mLinha);
    const duracaoMinutos = (hFim * 60 + mFim) - (hInicio * 60 + mInicio);

    // Se o resultado for entre 0 e o intervalo da célula (ex: 59), o card começa aqui
    return {
      top: (diffMinutosTop / intervalo) * 100, // % de deslocamento para baixo
      altura: (duracaoMinutos / intervalo) * 100 // % de altura proporcional
    };
  };

  return (
    <div
      className="agenda-grid-container"
      style={{
        ['--profs' as any]: profissionais.length || 1,
        gridTemplateColumns: `60px repeat(${profissionais.length || 1}, minmax(160px, 1fr))`,
      }}
    >
      <div className="agenda-header-cell gmt-label">24H</div>
      {profissionais.map(prof => <div key={prof} className="agenda-header-cell">{prof}</div>)}

      {linhasDeTempo.map(hora => (
        <React.Fragment key={hora}>
          <div className="agenda-time-label">{hora}</div>
          {profissionais.map(prof => {
            // Filtramos eventos que pertencem a esta "caixa" de tempo
            const eventosAqui = agendamentos.filter(ag => {
                const [hAg, mAg] = ag.horaInicio.split(':').map(Number);
                const [hL, mL] = hora.split(':').map(Number);
                const totalMinAg = hAg * 60 + mAg;
                const totalMinLinha = hL * 60 + mL;
                return ag.profissional === prof && totalMinAg >= totalMinLinha && totalMinAg < (totalMinLinha + parseInt(intervalo));
            });

            return (
              <div key={`${prof}-${hora}`} className="agenda-slot-interativo" onClick={() => onCellClick(prof, hora)}>
                {eventosAqui.map(ev => {
                  const { top, altura } = calcularPosicaoCard(ev.horaInicio, ev.horaFim, hora);
                  return (
                    <div 
                      key={ev.id} 
                      className="card-agendamento-flutuante"
                      style={{
                        top: `${top}%`,
                        height: `${altura}%`,
                        backgroundColor: ev.cor
                      }}
                    >
                      <div className="card-info">
                        <strong>{ev.cliente}</strong>
                        <span>{ev.servico} </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
};

export default AgendaGrid;