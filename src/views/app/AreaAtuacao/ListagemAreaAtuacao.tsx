// @ts-nocheck
// caminho: src/views/app/AreaAtuacao/ListagemAreaAtuacao.jsx
import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import BtnNovo from '@/components/buttons/BtnNovo';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import { areasAtuacaoService } from '@/services/endpoints';
import './ListagemAreaAtuacao.css'; // Estilo isolado para as badges

export default function ListagemAreaAtuacao() {
  const [busca, setBusca] = useState('');
  const [areas, setAreas] = useState([]);

  // GET: Simula a busca das áreas registradas ao abrir a tela
  useEffect(() => {
    let ativo = true;
    areasAtuacaoService.listar()
      .then((dados) => { if (ativo) setAreas(Array.isArray(dados) ? dados : (dados?.content ?? [])); })
      .catch(() => { /* erro já tratado pelo interceptor */ });
    return () => { ativo = false; };
  }, []);

  // Lógica de filtro reativa baseada no estado 'areas'
  const areasFiltradas = areas.filter(area => 
    area.nome.toLowerCase().includes(busca.toLowerCase()) ||
    area.nomeLoja.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Layout title="Agendly">
      <CardCrud>
        <div className="listagem-cabecalho">
          <div>
            <h2 className="crud-titulo-pagina">Áreas de Atuação</h2>
            <p className="crud-subtitulo-pagina">Gerencie as divisões de serviços e setores das suas lojas.</p>
          </div>
          
          <BtnNovo to="/cadastro-area-atuacao" label="Nova Área" />
        </div>

        {/* Campo de Busca */}
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Filtrar por setor ou loja..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid var(--campo-borda)',
              backgroundColor: 'var(--campo-fundo)',
              color: 'var(--texto-principal)',
              outline: 'none',
              width: '300px'
            }}
          />
        </div>

        <div className="tabela-container">
          <table className="tabela-SaaS">
            <thead>
              <tr>
                <th>ID</th>
                <th>Setor / Área</th>
                <th>Descrição</th>
                <th>Loja Vinculada</th>
                <th style={{ textAlign: 'center' }}>Nº Funcionários</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {areasFiltradas.map((area) => {
                const temFuncionario = area.funcionario?.length > 0;
                return (
                  <tr key={area.id}>
                    <td>{area.id}</td>
                    <td style={{ fontWeight: '500', color: 'var(--texto-principal)' }}>{area.nome}</td>
                    <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={area.descricao}>
                      {area.descricao || 'Sem descrição'}
                    </td>
                    <td>{area.nomeLoja}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge-contador ${temFuncionario ? 'badge-ativo' : 'badge-vazio'}`}>
                        {area.funcionario?.length || 0} profissional(is)
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-acao-tabela" onClick={() => alert(`Editando setor: ${area.nome}`)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {areasFiltradas.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--texto-secundario)', padding: '20px' }}>
                    Nenhuma área de atuação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardCrud>
    </Layout>
  );
}