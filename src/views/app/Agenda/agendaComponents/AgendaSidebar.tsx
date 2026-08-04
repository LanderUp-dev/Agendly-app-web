// @ts-nocheck
import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import MiniCalendario from '../calendario/MiniCalendario';
import './AgendaSidebar.css';

const CADASTROS = [
  { label: 'Cliente', to: '/cadastro-cliente' },
  { label: 'Loja', to: '/cadastro-loja' },
  { label: 'Serviço', to: '/cadastro-servico' },
  { label: 'Equipe', to: '/cadastro-equipe' },
  { label: 'Funcionário', to: '/cadastro-funcionario' },
  { label: 'Cobrancista', to: '/cadastro-cobrancista' },
  { label: 'Área de Atuação', to: '/cadastro-area-atuacao' },
  { label: 'Área de Funcionário', to: '/cadastro-area-funcionario' },
];

const REGISTROS = [
  { label: 'Clientes', to: '/listagem-clientes' },
  { label: 'Lojas', to: '/listagem-lojas' },
  { label: 'Serviços', to: '/listagem-servicos' },
  { label: 'Equipes', to: '/listagem-equipes' },
  { label: 'Funcionários', to: '/listagem-funcionarios' },
  { label: 'Cobrancistas', to: '/listagem-cobrancistas' },
  { label: 'Áreas de Atuação', to: '/listagem-areas-atuacao' },
  { label: 'Áreas de Funcionário', to: '/listagem-areas-funcionario' },
];

const AgendaSidebar = ({
  dataSelecionada,
  setDataSelecionada,
  profissionais = [],
  profissionaisSelecionados = [],
  toggleProfissional = () => {},
  setTodosProfissionais = () => {},
}) => {
  const [menuAberto, setMenuAberto] = useState(null); // 'cadastrar' | 'registros' | null

  const todosMarcados =
    profissionais.length > 0 && profissionaisSelecionados.length === profissionais.length;

  const alternarMenu = (nome) => setMenuAberto((atual) => (atual === nome ? null : nome));

  return (
    <aside className="sidebar-container-agenda">
      <div className="bloco-topo-sidebar">
        <div className="sidebar-acoes">
          <div className="sidebar-menu-wrapper">
            <button
              className={`botao-cadastrar-lateral ${menuAberto === 'cadastrar' ? 'ativo' : ''}`}
              onClick={() => alternarMenu('cadastrar')}
              type="button"
            >
              + Cadastrar
            </button>
            {menuAberto === 'cadastrar' && (
              <div className="sidebar-dropdown">
                {CADASTROS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="sidebar-dropdown-item"
                    onClick={() => setMenuAberto(null)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="sidebar-menu-wrapper">
            <button
              className={`botao-registros-lateral ${menuAberto === 'registros' ? 'ativo' : ''}`}
              onClick={() => alternarMenu('registros')}
              type="button"
            >
              # Registros
            </button>
            {menuAberto === 'registros' && (
              <div className="sidebar-dropdown">
                {REGISTROS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="sidebar-dropdown-item"
                    onClick={() => setMenuAberto(null)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container-mini-calendario">
        <MiniCalendario
          dataSelecionada={dataSelecionada}
          setDataSelecionada={setDataSelecionada}
        />
      </div>

      <div className="filtros-extras">
        <p className="titulo-filtros">Meus Profissionais</p>
        <div className="lista-filtros">
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
      </div>
    </aside>
  );
};

export default AgendaSidebar;
