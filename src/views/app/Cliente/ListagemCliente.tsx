// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { ListagemCards } from '@/components/listagem/ListagemCards';
import { clientesService } from '@/services/endpoints';

const formatarData = (dataStr) => {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
};

const iniciais = (nome = '', sobreNome = '') =>
  `${(nome[0] ?? '').toUpperCase()}${(sobreNome[0] ?? '').toUpperCase()}` || '?';

export default function ListagemCliente() {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    let ativo = true;
    clientesService.listar()
      .then((dados) => { if (ativo) setClientes(Array.isArray(dados) ? dados : (dados?.content ?? [])); })
      .catch(() => {});
    return () => { ativo = false; };
  }, []);

  return (
    <ListagemCards
      titulo="Clientes Cadastrados"
      subtitulo="Gerencie as contas de clientes."
      novoTo="/cadastro-cliente"
      novoLabel="Novo Cliente"
      itens={clientes}
      buscaPlaceholder="Buscar por nome ou CPF..."
      filtrar={(c, termo) => {
        const nome = `${c.nome ?? ''} ${c.sobreNome ?? ''}`.toLowerCase();
        return nome.includes(termo) || (c.cpf ?? '').includes(termo);
      }}
      mensagemVazio="Nenhum cliente encontrado."
      renderCard={(cliente) => (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              aria-hidden
              style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'var(--botao-primario)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '1rem', flexShrink: 0,
              }}
            >
              {iniciais(cliente.nome, cliente.sobreNome)}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 className="listagem-card-titulo" style={{ fontSize: '1.05rem' }}>
                {cliente.nome} {cliente.sobreNome}
              </h3>
              <div className="listagem-card-info" style={{ marginTop: 2 }}>
                CPF: {cliente.cpf}
              </div>
            </div>
          </div>

          <div className="listagem-card-info">
            <div>{cliente.email}</div>
            <div>{cliente.celular}</div>
            <div style={{ marginTop: 6 }}>
              <strong>Nasc.:</strong> {formatarData(cliente.dtaNascimento)}
            </div>
            {cliente.nomeLoja && (
              <div><strong>Loja:</strong> {cliente.nomeLoja}</div>
            )}
          </div>

          <button
            className="btn-acao-tabela listagem-card-acao"
            onClick={() => alert('Editar: ' + cliente.nome)}
          >
            Editar
          </button>
        </>
      )}
    />
  );
}
