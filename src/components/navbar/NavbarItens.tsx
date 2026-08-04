// @ts-nocheck
import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { obterUsuario, limparSessao } from '@/lib/auth';
import './NavbarItens.css';

const NavbarItens = () => {
  const usuario = obterUsuario();
  const navigate = useNavigate();

  const sair = () => {
    limparSessao();
    navigate({ to: '/login' });
  };

  return (
    <div className="navbar-grupo-acoes">
      <div className="navbar-perfil-container" onClick={sair} title="Sair" role="button">
        <button className="navbar-btn-perfil-circle" aria-label="Sair" type="button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </button>
        <span className="navbar-perfil-label">{usuario?.nome || 'Minha conta'}</span>
      </div>
    </div>
  );
};

export default NavbarItens;
