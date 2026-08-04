// @ts-nocheck
import React, { useEffect, useState } from 'react';
import './AgendaView.css';

import Navbar from '../../../components/navbar/Navbar';
import AgendaSidebar from './agendaComponents/AgendaSidebar';
import AgendaHeader from './agendaComponents/AgendaHeader';
import AgendaGrid from './agendaComponents/AgendaGrid';
import AgendaMobileBar from './agendaComponents/AgendaMobileBar';
import AgendamentoModal from './agendaComponents/AgendamentoModal';

import { funcionariosService, agendamentosService } from '@/services/endpoints';

const AgendaView = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [dadosAgendamento, setDadosAgendamento] = useState({ profissional: '', hora: '' });
  const [intervaloTempo, setIntervaloTempo] = useState('60');
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [profissionais, setProfissionais] = useState<string[]>([]);
  const [profissionaisSelecionados, setProfissionaisSelecionados] = useState<string[]>([]);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);

  useEffect(() => {
    let ativo = true;
    funcionariosService
      .listar()
      .then((data) => {
        if (!ativo) return;
        const lista = Array.isArray(data) ? data : data?.content ?? [];
        const nomes = lista.map((f: any) => f.nome ?? f.nomeCompleto ?? String(f.id));
        setProfissionais(nomes);
        setProfissionaisSelecionados(nomes);
      })
      .catch(() => {});
    agendamentosService
      .listar()
      .then((data) => {
        if (!ativo) return;
        const lista = Array.isArray(data) ? data : data?.content ?? [];
        setAgendamentos(lista);
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);

  const toggleProfissional = (nome: string) => {
    setProfissionaisSelecionados((atual) =>
      atual.includes(nome) ? atual.filter((p) => p !== nome) : [...atual, nome]
    );
  };

  const setTodosProfissionais = (marcar: boolean) => {
    setProfissionaisSelecionados(marcar ? profissionais : []);
  };

  const dataFormatada = dataSelecionada.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const agendamentosFiltrados = agendamentos.filter(
    (ag) => ag.data === dataFormatada && profissionaisSelecionados.includes(ag.profissional)
  );

  const colunasProfissionais = profissionaisSelecionados;

  const handleCliqueHorario = (profissional, hora) => {
    setDadosAgendamento({ profissional, hora });
    setModalAberto(true);
  };

  return (
    <>
      <div className="agenda-page-container">
        <Navbar />

        <AgendaMobileBar
          dataSelecionada={dataSelecionada}
          setDataSelecionada={setDataSelecionada}
          intervaloTempo={intervaloTempo}
          setIntervaloTempo={setIntervaloTempo}
          profissionais={profissionais}
          profissionaisSelecionados={profissionaisSelecionados}
          toggleProfissional={toggleProfissional}
          setTodosProfissionais={setTodosProfissionais}
        />

        <div className="google-calendar-layout">
          <AgendaSidebar
            dataSelecionada={dataSelecionada}
            setDataSelecionada={setDataSelecionada}
            profissionais={profissionais}
            profissionaisSelecionados={profissionaisSelecionados}
            toggleProfissional={toggleProfissional}
            setTodosProfissionais={setTodosProfissionais}
          />

          <main className="main-content">
            <AgendaHeader
              intervaloTempo={intervaloTempo}
              setIntervaloTempo={setIntervaloTempo}
              dataSelecionada={dataSelecionada}
              setDataSelecionada={setDataSelecionada}
            />

            <AgendaGrid
              profissionais={colunasProfissionais}
              agendamentos={agendamentosFiltrados}
              intervalo={intervaloTempo}
              onCellClick={handleCliqueHorario}
            />
          </main>
        </div>
      </div>

      {modalAberto && (
        <AgendamentoModal
          dadosAgendamento={dadosAgendamento}
          onClose={() => setModalAberto(false)}
          onSave={() => alert('Salvo com sucesso!')}
        />
      )}
    </>
  );
};

export default AgendaView;
