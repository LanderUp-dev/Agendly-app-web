// @ts-nocheck
// caminho: src/views/app/Cobrancista/ListagemCobrancista.jsx
import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import BtnNovo from '@/components/buttons/BtnNovo';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import { cobrancistasService } from '@/services/endpoints';
export default function ListagemCobrancista() {
  const [busca, setBusca] = useState('');
  const [cobrancistas, setCobrancistas] = useState([]);

  useEffect(() => {
    let ativo = true;
    cobrancistasService.listar()
      .then((dados) => { if (ativo) setCobrancistas(Array.isArray(dados) ? dados : (dados?.content ?? [])); })
      .catch(() => { /* erro já tratado pelo interceptor */ });
    return () => { ativo = false; };
  }, []);

  const filtrados = cobrancistas.filter(cob => 
    cob.nome.toLowerCase().includes(busca.toLowerCase()) || 
    cob.nomeLoja.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Layout title="Agendly">
      <CardCrud>
        <div className="listagem-cabecalho">
          <div>
            <h2 className="crud-titulo-pagina">Cobrancistas</h2>
            <p className="crud-subtitulo-pagina">Lista de profissionais ativos e suas alocações.</p>
          </div>
          <BtnNovo to="/cadastro-cobrancista" label="Novo Cobrancista" />
        </div>

        <input 
          type="text" placeholder="Buscar por nome ou loja..." value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ marginBottom: '20px', padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid var(--campo-borda)', backgroundColor: 'var(--campo-fundo)' }}
        />

        <div className="tabela-container">
          <table className="tabela-SaaS">
            <thead>
              <tr>
                <th>ID</th><th>Nome</th><th>Contatos</th><th>Loja</th><th>Descrição</th><th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((cob) => (
                <tr key={cob.id}>
                  <td>{cob.id}</td>
                  <td style={{ fontWeight: '500' }}>{cob.nome}</td>
                  <td>{cob.email} <br /> <small style={{ color: 'var(--texto-secundario)' }}>{cob.celular}</small></td>
                  <td>{cob.nomeLoja}</td>
                  <td>{cob.descricao || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-acao-tabela">Editar</button>
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