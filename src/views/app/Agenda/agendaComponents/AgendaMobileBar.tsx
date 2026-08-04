// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Calendar, SlidersHorizontal, Search, Moon, Sun, X } from 'lucide-react';
import MiniCalendario from '../calendario/MiniCalendario';
import { useTheme } from '../../../../context/ThemeContext';
import './AgendaMobileBar.css';

const AgendaMobileBar = ({
  dataSelecionada,
  setDataSelecionada,
  intervaloTempo,
  setIntervaloTempo,
  profissionais = [],
  profissionaisSelecionados = [],
  toggleProfissional = () => {},
  setTodosProfissionais = () => {},
}) => {
  const todosMarcados =
    profissionais.length > 0 && profissionaisSelecionados.length === profissionais.length;
  const { theme, toggleTheme } = useTheme();
  const [painelAberto, setPainelAberto] = useState(null); // 'calendario' | 'filtros' | 'busca' | null
  const [busca, setBusca] = useState('');
  const ref = useRef(null);

  // fecha ao clicar fora
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setPainelAberto(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (nome) => setPainelAberto((atual) => (atual === nome ? null : nome));

  const dataCurta = dataSelecionada.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  const irParaHoje = () => {
    setDataSelecionada(new Date());
    setPainelAberto(null);
  };

  return (
    <div className="agenda-mobile-bar" ref={ref}>
      <div className="mbar-linha-principal">
        <button
          className={`mbar-icon-btn ${painelAberto === 'calendario' ? 'ativo' : ''}`}
          onClick={() => toggle('calendario')}
          aria-label="Calendário"
        >
          <Calendar size={18} />
        </button>

        <button
          className={`mbar-icon-btn ${painelAberto === 'filtros' ? 'ativo' : ''}`}
          onClick={() => toggle('filtros')}
          aria-label="Filtros"
        >
          <SlidersHorizontal size={18} />
        </button>

        <button className="mbar-data-chip" onClick={irParaHoje} title="Voltar para hoje">
          {dataCurta}
        </button>

        <div className="mbar-spacer" />

        <button
          className={`mbar-icon-btn ${painelAberto === 'busca' ? 'ativo' : ''}`}
          onClick={() => toggle('busca')}
          aria-label="Buscar cliente"
        >
          <Search size={18} />
        </button>

        <select
          className="mbar-select"
          value={intervaloTempo}
          onChange={(e) => setIntervaloTempo(e.target.value)}
          aria-label="Intervalo"
        >
          <option value="15">15m</option>
          <option value="30">30m</option>
          <option value="60">1h</option>
        </select>

        <button
          className="mbar-icon-btn"
          onClick={toggleTheme}
          aria-label="Alternar tema"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {painelAberto === 'busca' && (
        <div className="mbar-painel mbar-painel-busca">
          <Search size={16} />
          <input
            autoFocus
            placeholder="Pesquisar cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button className="mbar-fechar" onClick={() => setPainelAberto(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {painelAberto === 'calendario' && (
        <div className="mbar-painel mbar-painel-calendario">
          <MiniCalendario
            dataSelecionada={dataSelecionada}
            setDataSelecionada={(d) => {
              setDataSelecionada(d);
              setPainelAberto(null);
            }}
          />
        </div>
      )}

      {painelAberto === 'filtros' && (
        <div className="mbar-painel mbar-painel-filtros">
          <p className="mbar-titulo-secao">Meus Profissionais</p>
          <label>
            <input
              type="checkbox"
              checked={todosMarcados}
              onChange={(e) => setTodosProfissionais(e.target.checked)}
            />{' '}
            Todos
          </label>
          {profissionais.map((p) => (
            <label key={p}>
              <input
                type="checkbox"
                checked={profissionaisSelecionados.includes(p)}
                onChange={() => toggleProfissional(p)}
              />{' '}
              {p}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgendaMobileBar;
