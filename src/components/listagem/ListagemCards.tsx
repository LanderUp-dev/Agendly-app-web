// @ts-nocheck
import React, { useState, useMemo } from 'react';
import BtnNovo from '@/components/buttons/BtnNovo';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import './ListagemCards.css';

/**
 * Componente padronizado de listagem em formato de cards.
 *
 * Props:
 *  - titulo, subtitulo          -> cabeçalho da página
 *  - novoTo, novoLabel          -> botão "+ Novo X" (rota destino)
 *  - itens                      -> array de dados
 *  - buscaPlaceholder           -> placeholder do input de busca
 *  - filtrar(item, termo)       -> função de filtro por item
 *  - renderCard(item)           -> conteúdo customizado do card
 *  - mensagemVazio              -> texto quando nada é encontrado
 *  - layoutTitle                -> título do Layout (default 'Agendly')
 */
export const ListagemCards = ({
  titulo,
  subtitulo,
  novoTo,
  novoLabel = 'Novo',
  itens = [],
  buscaPlaceholder = 'Pesquisar...',
  filtrar,
  renderCard,
  mensagemVazio = 'Nenhum item encontrado.',
  layoutTitle = 'Agendly',
}) => {
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return itens;
    if (typeof filtrar === 'function') return itens.filter((it) => filtrar(it, termo));
    return itens.filter((it) => JSON.stringify(it).toLowerCase().includes(termo));
  }, [itens, busca, filtrar]);

  return (
    <Layout title={layoutTitle}>
      <CardCrud>
        <div className="listagem-cabecalho">
          <div>
            <h2 className="crud-titulo-pagina">{titulo}</h2>
            {subtitulo && <p className="crud-subtitulo-pagina">{subtitulo}</p>}
          </div>
          {novoTo && <BtnNovo to={novoTo} label={novoLabel} />}
        </div>

        <input
          type="text"
          placeholder={buscaPlaceholder}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="listagem-cards-busca"
        />

        <div className="listagem-cards-grid">
          {filtrados.map((item, idx) => (
            <div key={item.id ?? idx} className="listagem-card">
              {renderCard(item)}
            </div>
          ))}
        </div>

        {filtrados.length === 0 && (
          <p className="listagem-cards-vazio">{mensagemVazio}</p>
        )}
      </CardCrud>
    </Layout>
  );
};

export default ListagemCards;
