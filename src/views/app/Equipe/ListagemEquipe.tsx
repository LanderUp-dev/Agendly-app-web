// @ts-nocheck
// caminho: src/views/app/Equipe/ListagemEquipe.jsx
import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import BtnNovo from '@/components/buttons/BtnNovo';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import { equipesService } from '@/services/endpoints';
export default function ListagemEquipe() {
  const [busca, setBusca] = useState('');
  const [equipes, setEquipes] = useState([]);

  useEffect(() => {
    let ativo = true;
    equipesService.listar()
      .then((dados) => { if (ativo) setEquipes(Array.isArray(dados) ? dados : (dados?.content ?? [])); })
      .catch(() => { /* erro já tratado pelo interceptor */ });
    return () => { ativo = false; };
  }, []);

  const filtradas = equipes.filter(eq => 
    eq.nomeUsuario.toLowerCase().includes(busca.toLowerCase()) ||
    eq.nomeLoja.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Layout title="Agendly">
      <CardCrud>
        <div className="listagem-cabecalho">
          <div>
            <h2 className="crud-titulo-pagina">Vínculos de Equipes</h2>
            <p className="crud-subtitulo-pagina">Alocação de funcionários por unidade.</p>
          </div>
          <BtnNovo to="/cadastro-equipe" label="Vincular Equipe" />
        </div>

        <input 
          type="text" placeholder="Buscar por funcionário ou loja..." value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ marginBottom: '20px', padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid var(--campo-borda)', backgroundColor: 'var(--campo-fundo)', color: 'var(--texto-principal)' }}
        />

        <div className="tabela-container">
          <table className="tabela-SaaS">
            <thead>
              <tr>
                <th>UUID</th><th>Funcionário</th><th>Loja Alocada</th><th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((eq) => (
                <tr key={eq.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{eq.id}</td>
                  <td style={{ fontWeight: '500' }}>{eq.nomeUsuario}</td>
                  <td>{eq.nomeLoja}</td>
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