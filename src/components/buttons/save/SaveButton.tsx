// @ts-nocheck
import React from 'react';
import './SaveButton.css';

export const SaveButton = ({ className = "btn-global-save",onClick, disabled, loading, label = "Salvar" }) => {
  return (
    <button 
      type="submit" /* Por padrão, age como submit no formulário */
      className= {className}
      onClick={onClick} 
      disabled={disabled || loading}
    >
      {loading ? 'Processando...' : label}
    </button>
  );
};