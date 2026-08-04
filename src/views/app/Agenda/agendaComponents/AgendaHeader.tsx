// @ts-nocheck
import React from 'react';
import './AgendaHeader.css';
import { useTheme } from '../../../../context/ThemeContext';
import { ThemeToggleIcon } from '@/components/ui/ThemeToggleIcon'; // Ajuste o caminho conforme onde salvou o componente

const AgendaHeader = ({ intervaloTempo, setIntervaloTempo, dataSelecionada, setDataSelecionada }) => {
  const { theme, toggleTheme } = useTheme();

  const formatarDataExtenso = (data) => {
    return data.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const irParaHoje = () => {
    setDataSelecionada(new Date());
  };

  return (
    <header className="header-container-principal">
      {/* Lado Esquerdo: Botão Hoje + Exibição da Data */}
      <div className="header-bloco-esquerdo">
        <button className="btn-hoje-atual" onClick={irParaHoje}>
          Hoje
        </button>

        <h2 className="texto-data-selecionada">
          {formatarDataExtenso(dataSelecionada)}
        </h2>
      </div>

      {/* Lado Direito: Busca + Seletor + Tema */}
      <div className="header-bloco-direito">
        <div className="input-busca-wrapper">
          <svg className="lupa-svg" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
          </svg>
          <input type="text" placeholder="Pesquise clientes..." />
        </div>

        <select
          className="dropdown-tempo-google"
          value={intervaloTempo}
          onChange={(e) => setIntervaloTempo(e.target.value)}
        >
          <option value="15">15 Minutos</option>
          <option value="30">30 Minutos</option>
          <option value="60">1 Hora</option>
        </select>

        <button
          className="btn-toggle-tema"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
          aria-label="Alternar tema"
        >
          <ThemeToggleIcon theme={theme} size={20} />
        </button>
      </div>
    </header>
  );
};

export default AgendaHeader;