// @ts-nocheck
// caminho: src/views/app/Servico/ListagemServico.jsx
import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import BtnNovo from '@/components/buttons/BtnNovo';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import { servicosService } from '@/services/endpoints';
export default function ListagemServico() {
  const [busca, setBusca] = useState('');
  const [servicos, setServicos] = useState([]);

  useEffect(() => {
    let ativo = true;
    servicosService.listar()
      .then((dados) => { if (ativo) setServicos(Array.isArray(dados) ? dados : (dados?.content ?? [])); })
      .catch(() => { /* erro já tratado pelo interceptor */ });
    return () => { ativo = false; };
  }, []);

  const filtrados = servicos.filter(s => 
    s.nome.toLowerCase().includes(busca.toLowerCase()) ||
    s.nomeArea.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <Layout title="Agendly">
      <CardCrud>
        <div className="listagem-cabecalho">
          <div>
            <h2 className="crud-titulo-pagina">Serviços Cadastrados</h2>
            <p className="crud-subtitulo-pagina">Catálogo de procedimentos e taxas de repasse.</p>
          </div>
          <BtnNovo to="/cadastro-servico" label="Novo Serviço" />
        </div>

        <input 
          type="text" placeholder="Pesquisar..." value={busca} onChange={(e) => setBusca(e.target.value)}
          style={{ marginBottom: '20px', padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid var(--campo-borda)', backgroundColor: 'var(--campo-fundo)' }}
        />

        <div className="tabela-container">
          <table className="tabela-SaaS">
            <thead>
              <tr><th>ID</th><th>Serviço</th><th>Preço</th><th>Comissão</th><th>Setor</th><th>Unidade</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtrados.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td>{s.nome}<br/><small style={{color:'var(--texto-secundario)'}}>{s.descricao}</small></td>
                  <td>R$ {s.preco.toFixed(2)}</td>
                  <td>{s.comissaoLoja}%</td>
                  <td>{s.nomeArea}</td>
                  <td>{s.nomeLoja}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-acao-tabela" onClick={() => alert("Editar: " + s.nome)}>Editar</button>
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