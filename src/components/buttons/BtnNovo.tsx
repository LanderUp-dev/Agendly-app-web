// @ts-nocheck
import React from 'react';
import { Link } from '@tanstack/react-router';
import './BtnNovo.css';

/**
 * Botão padronizado de "+ Novo X" para as listagens.
 * Usa <Link> quando há `to`, ou <button> quando há `onClick`.
 */
export const BtnNovo = ({ to, onClick, label = 'Novo', icon = '+', className = '', ...rest }) => {
  const conteudo = (
    <>
      <span className="btn-novo-icone" aria-hidden="true">{icon}</span>
      <span className="btn-novo-label">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`btn-novo ${className}`} {...rest}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`btn-novo ${className}`} {...rest}>
      {conteudo}
    </button>
  );
};

export default BtnNovo;
