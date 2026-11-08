// @requisito RO-30 RO-31
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarX2, UserPlus } from "lucide-react";
import "./AgendaView.css";

import { AppNavbar, ButtonLink, Carregando, EmptyState, ErrorState } from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import AgendaSidebar from "./agendaComponents/AgendaSidebar";
import AgendaHeader from "./agendaComponents/AgendaHeader";
import AgendaGrid, { AgendaGridSkeleton } from "./agendaComponents/AgendaGrid";
import AgendamentoModal from "./agendaComponents/AgendamentoModal";
import DetalheAgendamentoModal from "./agendaComponents/DetalheAgendamentoModal";
import ComandaModal from "./agendaComponents/ComandaModal";
import "../Financeiro/Financeiro.css";
import type { AgendamentoAgenda } from "@/services/endpoints";
import PrimeirosPassos from "./agendaComponents/PrimeirosPassos";

import { funcionariosService, agendamentosService } from "@/services/endpoints";

const AgendaView = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<AgendamentoAgenda | null>(null);
  const [cobrando, setCobrando] = useState<AgendamentoAgenda | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const [dadosAgendamento, setDadosAgendamento] = useState({ profissional: "", hora: "" });
  const [intervaloTempo, setIntervaloTempo] = useState("60");
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [profissionaisSelecionados, setProfissionaisSelecionados] = useState<string[]>([]);

  const funcionarios = useCarregar(() => funcionariosService.listar(), []);
  const agendamentos = useCarregar(() => agendamentosService.listar(), []);

  const profissionais = useMemo(
    () =>
      funcionarios.dados.map(
        (f: { id: number; nome?: string; nomeCompleto?: string }) =>
          f.nome ?? f.nomeCompleto ?? String(f.id),
      ),
    [funcionarios.dados],
  );

  // Profissionais novos entram marcados; quem o usuário desmarcou continua
  // desmarcado quando a lista é recarregada.
  const conhecidos = useRef<string[]>([]);
  useEffect(() => {
    const anteriores = conhecidos.current;
    conhecidos.current = profissionais;
    setProfissionaisSelecionados((atual) => [
      ...atual.filter((p) => profissionais.includes(p)),
      ...profissionais.filter((p) => !anteriores.includes(p) && !atual.includes(p)),
    ]);
  }, [profissionais]);

  // Esc fecha o painel de filtros (tablet/mobile).
  useEffect(() => {
    if (!painelAberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPainelAberto(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [painelAberto]);

  const toggleProfissional = (nome: string) => {
    setProfissionaisSelecionados((atual) =>
      atual.includes(nome) ? atual.filter((p) => p !== nome) : [...atual, nome],
    );
  };

  const setTodosProfissionais = (marcar: boolean) => {
    setProfissionaisSelecionados(marcar ? profissionais : []);
  };

  const dataFormatada = dataSelecionada.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const agendamentosDoDia = agendamentos.dados.filter((ag) => ag.data === dataFormatada);
  const agendamentosFiltrados = agendamentosDoDia.filter((ag) =>
    profissionaisSelecionados.includes(ag.profissional),
  );
  const servicosDoDia = [
    ...new Set(agendamentosDoDia.map((ag) => ag.servico).filter(Boolean)),
  ].sort();

  const colunasProfissionais = profissionais.filter((p) => profissionaisSelecionados.includes(p));

  const handleCliqueHorario = (profissional: string, hora: string) => {
    setDadosAgendamento({ profissional, hora });
    setModalAberto(true);
  };

  const carregando = funcionarios.carregando || agendamentos.carregando;
  const erro = funcionarios.erro || agendamentos.erro;
  const recarregar = () => {
    funcionarios.recarregar();
    agendamentos.recarregar();
  };

  let conteudo;
  if (carregando) {
    conteudo = (
      <Carregando
        ativo
        contexto="Carregando agenda..."
        skeleton={<AgendaGridSkeleton colunas={3} />}
        onTentarNovamente={recarregar}
      />
    );
  } else if (erro) {
    conteudo = (
      <ErrorState
        titulo="Não foi possível carregar a agenda"
        mensagem={erro.mensagem}
        onTentarNovamente={recarregar}
      />
    );
  } else if (profissionais.length === 0) {
    conteudo = (
      <EmptyState
        icone={<UserPlus size={22} strokeWidth={1.75} />}
        titulo="Nenhum profissional cadastrado"
        texto="Cada funcionário vira uma coluna da agenda."
        acao={<ButtonLink to="/cadastro-funcionario">Cadastrar funcionário</ButtonLink>}
      />
    );
  } else if (colunasProfissionais.length === 0) {
    conteudo = (
      <EmptyState
        icone={<CalendarX2 size={22} strokeWidth={1.75} />}
        titulo="Nenhum profissional selecionado"
        texto="Marque ao menos um profissional em “Profissionais” para ver a agenda."
      />
    );
  } else {
    conteudo = (
      <AgendaGrid
        profissionais={colunasProfissionais}
        agendamentos={agendamentosFiltrados}
        intervalo={intervaloTempo}
        onCellClick={handleCliqueHorario}
        onAgendamentoClick={setDetalhe}
      />
    );
  }

  return (
    <div className="agenda-pagina">
      <a href="#agenda-conteudo" className="pular-para-conteudo">
        Pular para a agenda
      </a>
      <AppNavbar contido={false} />

      <div className="agenda-corpo">
        <AgendaSidebar
          id="agenda-painel"
          aberta={painelAberto}
          dataSelecionada={dataSelecionada}
          setDataSelecionada={(d: Date) => {
            setDataSelecionada(d);
            setPainelAberto(false);
          }}
          profissionais={profissionais}
          profissionaisSelecionados={profissionaisSelecionados}
          toggleProfissional={toggleProfissional}
          setTodosProfissionais={setTodosProfissionais}
          servicosDoDia={servicosDoDia}
        />
        {painelAberto && (
          <div className="agenda-veu" onClick={() => setPainelAberto(false)} aria-hidden="true" />
        )}

        <main id="agenda-conteudo" className="agenda-principal" tabIndex={-1}>
          <AgendaHeader
            intervaloTempo={intervaloTempo}
            setIntervaloTempo={setIntervaloTempo}
            dataSelecionada={dataSelecionada}
            setDataSelecionada={setDataSelecionada}
            painelAberto={painelAberto}
            onAlternarPainel={() => setPainelAberto((v) => !v)}
          />
          <div className="agenda-area">
            <PrimeirosPassos />
            {conteudo}
          </div>
        </main>
      </div>

      <DetalheAgendamentoModal
        agendamento={detalhe}
        onFechar={() => setDetalhe(null)}
        onAlterado={() => agendamentos.recarregar()}
        onFecharAtendimento={(a) => {
          setDetalhe(null);
          setCobrando(a);
        }}
      />

      <ComandaModal
        agendamento={cobrando}
        onFechar={() => setCobrando(null)}
        onFechado={() => agendamentos.recarregar()}
      />

      <AgendamentoModal
        aberto={modalAberto}
        dadosAgendamento={dadosAgendamento}
        dataSelecionada={dataSelecionada}
        onClose={() => setModalAberto(false)}
        onCriado={() => agendamentos.recarregar()}
      />
    </div>
  );
};

export default AgendaView;
