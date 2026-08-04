// @ts-nocheck
import React, { useEffect, useState } from 'react';
import './AgendamentoModal.css';
import { clientesService, funcionariosService, servicosService } from '@/services/endpoints';


const AgendamentoModal = ({ dadosAgendamento, onClose, onSave }) => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [clienteBusca, setClienteBusca] = useState('');

  useEffect(() => {
    const norm = (d: any) => (Array.isArray(d) ? d : d?.content ?? []);
    clientesService.listar().then((d) => setClientes(norm(d))).catch(() => {});
    funcionariosService.listar().then((d) => setProfissionais(norm(d))).catch(() => {});
    servicosService.listar().then((d) => setServicos(norm(d))).catch(() => {});
  }, []);


  return (
    <div className="modal-overlay">
      <div className="modal-content-expanded">
        <h3>Cadastrar Agendamento</h3>

        <div className="modal-form-grid">
          
          {/* 1. LINHA DO CLIENTE */}
          <div className="modal-field full-width">
            <label>Cliente:</label>
            <div className="cliente-input-group">
              {/* O list="lista-clientes" conecta este input com o datalist abaixo */}
              <input 
                type="text" 
                list="lista-clientes" 
                placeholder="Busque por nome..." 
                className="modal-input"
                value={clienteBusca}
                onChange={(e) => setClienteBusca(e.target.value)}
              />
              <datalist id="lista-clientes">
                {clientes.map((c, index) => (
                  <option key={c.id ?? index} value={c.nome ?? c.nomeCompleto ?? ''} />
                ))}
              </datalist>
              
              <button 
                className="btn-add-cliente" 
                title="Cadastrar Novo Cliente"
                onClick={() => alert('Aqui abriria o modal de Novo Cliente!')}
              >
                +
              </button>
            </div>
          </div>

          {/* 2. PROFISSIONAL E SERVIÇO (Lado a lado) */}
          <div className="modal-row">
            <div className="modal-field">
              <label>Profissional:</label>
              <select className="modal-input" defaultValue={dadosAgendamento.profissional}>
                <option value="">Selecione...</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.nome ?? p.nomeCompleto ?? String(p.id)}>
                    {p.nome ?? p.nomeCompleto ?? String(p.id)}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <label>Serviço:</label>
              <select className="modal-input">
                <option value="">Selecione...</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.nome}>{s.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. DATA E HORA (Lado a lado) */}
          <div className="modal-row">
            <div className="modal-field">
              <label>Data:</label>
              <input type="date" className="modal-input" />
            </div>
            <div className="modal-field">
              <label>Hora:</label>
              <input 
                type="time" 
                className="modal-input" 
                defaultValue={`${dadosAgendamento.hora?.toString().padStart(2, '0') || '00'}:00`} 
              />
            </div>
          </div>

          {/* 4. DURAÇÃO E VALOR (Lado a lado) */}
          <div className="modal-row">
            <div className="modal-field">
              <label>Duração (minutos):</label>
              <input type="number" className="modal-input" placeholder="Ex: 30" />
            </div>
            <div className="modal-field">
              <label>Valor (R$):</label>
              <input type="number" className="modal-input" placeholder="Ex: 50,00" />
            </div>
          </div>

          {/* 5. OBSERVAÇÕES */}
          <div className="modal-field full-width">
            <label>Observações (opcional):</label>
            <textarea 
              className="modal-input" 
              rows="3" 
              placeholder="Detalhes do agendamento..."
            ></textarea>
          </div>

        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancelar">Cancelar</button>
          <button 
            onClick={() => {
              onSave();
              onClose();
            }} 
            className="btn-salvar"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgendamentoModal;