// @ts-nocheck
// caminho: src/views/app/AreaFuncionario/ListagemAreaFuncionario.jsx
import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import BtnNovo from '@/components/buttons/BtnNovo';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import { areasFuncionarioService } from '@/services/endpoints';
export default function ListagemAreaFuncionario() {
  const [busca, setBusca] = useState('');
  const [vinculos, setVinculos] = useState([]);

  useEffect(() => {
    let ativo = true;
    areasFuncionarioService.listar()
      .then((dados) => { if (ativo) setVinculos(Array.isArray(dados) ? dados : (dados?.content ?? [])); })
      .catch(() => { /* erro já tratado pelo interceptor */ });
    return () => { ativo = false; };
  }, []);

  const vinculosFiltrados = vinculos.filter(v => 
    v.nomeFuncionario.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Layout title="Agendly">
      <CardCrud>
        <div className="listagem-cabecalho">
          <div>
            <h2 className="crud-titulo-pagina">Especialidades</h2>
            <p className="crud-subtitulo-pagina">Profissionais e suas áreas de atendimento.</p>
          </div>
          <BtnNovo to="/cadastro-area-funcionario" label="Alocar Funcionário" />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nome..." 
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
                <th>UUID</th>
                <th>Funcionário</th>
                <th>Especialidade</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {vinculosFiltrados.map((v) => (
                <tr key={v.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.7 }}>{v.id}</td>
                  <td>{v.nomeFuncionario}</td>
                  <td>{v.nomeArea}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-acao-tabela" onClick={() => alert("Remover?")}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardCrud>
    </Layout>
  );
}