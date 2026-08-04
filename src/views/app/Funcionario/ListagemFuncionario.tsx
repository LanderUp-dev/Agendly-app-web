// @ts-nocheck
// caminho: src/views/app/Funcionario/ListagemFuncionario.jsx
import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import BtnNovo from '@/components/buttons/BtnNovo';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import { funcionariosService } from '@/services/endpoints';
export default function ListagemFuncionario() {
  const [busca, setBusca] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    let ativo = true;
    funcionariosService.listar()
      .then((dados) => { if (ativo) setFuncionarios(Array.isArray(dados) ? dados : (dados?.content ?? [])); })
      .catch(() => { /* erro já tratado pelo interceptor */ });
    return () => { ativo = false; };
  }, []);

  const filtrados = funcionarios.filter(f => 
    `${f.nome} ${f.sobrenome}`.toLowerCase().includes(busca.toLowerCase()) || 
    f.cpf.includes(busca)
  );

  const formatarData = (d) => d ? d.split('-').reverse().join('/') : '';

  return (
    <Layout title="Agendly">
      <CardCrud>
        <div className="listagem-cabecalho">
          <div>
            <h2 className="crud-titulo-pagina">Equipe de Funcionários</h2>
            <p className="crud-subtitulo-pagina">Gerencie colaboradores e áreas de atuação.</p>
          </div>
          <BtnNovo to="/cadastro-funcionario" label="Novo Funcionário" />
        </div>

        <input 
          type="text" placeholder="Buscar funcionário ou CPF..." value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ marginBottom: '20px', padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid var(--campo-borda)', backgroundColor: 'var(--campo-fundo)' }}
        />

        <div className="tabela-container">
          <table className="tabela-SaaS">
            <thead>
              <tr>
                <th>ID</th><th>Nome</th><th>CPF</th><th>Contatos</th><th>Nascimento</th><th>Loja</th><th>Áreas</th><th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td style={{ fontWeight: '500' }}>{f.nome} {f.sobrenome}</td>
                  <td>{f.cpf}</td>
                  <td>{f.email}<br/><small>{f.celular}</small></td>
                  <td>{formatarData(f.dtaNascimento)}</td>
                  <td>{f.nomeLoja}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {f.area?.map(a => <span key={a.id} style={{ background: 'var(--campo-fundo)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{a.nome}</span>)}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-acao-tabela" onClick={() => alert("Editar: " + f.nome)}>Editar</button>
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