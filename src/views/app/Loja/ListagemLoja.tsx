// @ts-nocheck
import React from 'react';
import { useState, useEffect } from 'react';
import { ListagemCards } from '@/components/listagem/ListagemCards';
import { lojasService } from '@/services/endpoints';

export default function ListagemLoja() {
  const [lojas, setLojas] = useState([]);

  useEffect(() => {
    let ativo = true;
    lojasService.listar()
      .then((dados) => { if (ativo) setLojas(Array.isArray(dados) ? dados : (dados?.content ?? [])); })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  return (
    <ListagemCards
      titulo="Unidades e Filiais"
      subtitulo="Selecione uma loja para gerenciar suas operações."
      novoTo="/cadastro-loja"
      novoLabel="Nova Loja"
      itens={lojas}
      buscaPlaceholder="Pesquisar loja..."
      filtrar={(loja, termo) =>
        loja.nome?.toLowerCase().includes(termo) || loja.cnpj?.includes(termo)
      }
      mensagemVazio="Nenhuma loja encontrada."
      renderCard={(loja) => (
        <>
          <h3 className="listagem-card-titulo">{loja.nome}</h3>
          <div className="listagem-card-info">
            <strong>CNPJ:</strong> {loja.cnpj} <br />
            <strong>Local:</strong> {loja.cidade} - {loja.estado}
          </div>
          <button
            className="btn-acao-tabela listagem-card-acao"
            onClick={() => alert(`Acessando: ${loja.nome}`)}
          >
            Acessar Unidade
          </button>
        </>
      )}
    />
  );
}
