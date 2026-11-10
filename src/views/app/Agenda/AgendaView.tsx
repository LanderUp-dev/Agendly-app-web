// @requisito RO-30 RO-31 RO-33 RU-01
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarX2, UserPlus } from "lucide-react";
import { useSearch } from "@tanstack/react-router";
import "./AgendaView.css";

import { AppNavbar, ButtonLink, Carregando, EmptyState, ErrorState } from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { obterLojaAtiva } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";
import AgendaSidebar, { type AreaFiltro } from "./agendaComponents/AgendaSidebar";
import AgendaHeader from "./agendaComponents/AgendaHeader";
import AgendaGrid, { AgendaGridSkeleton } from "./agendaComponents/AgendaGrid";
import AgendamentoModal from "./agendaComponents/AgendamentoModal";
import DetalheAgendamentoModal from "./agendaComponents/DetalheAgendamentoModal";
import ComandaModal from "./agendaComponents/ComandaModal";
import MoverAgendamentoModal, { type PedidoMover } from "./agendaComponents/MoverAgendamentoModal";
import {
  colunasVisiveis,
  isoDoDia,
  profissionaisDaArea,
  type ProfissionalComArea,
} from "./agendaComponents/arrastarAgenda";
import "../Financeiro/Financeiro.css";
import type { AgendamentoAgenda } from "@/services/endpoints";
import PrimeirosPassos from "./agendaComponents/PrimeirosPassos";

import { funcionariosService, agendamentosService } from "@/services/endpoints";

/** Área escolhida fica guardada na sessão (por loja). Sem storage, só não lembra. */
const chaveArea = () => `agendly_agenda_area_${obterLojaAtiva()?.lojaId ?? "?"}`;
const lerAreaSalva = (): number | null => {
  try {
    const v = window.sessionStorage.getItem(chaveArea());
    return v ? Number(v) || null : null;
  } catch {
    return null;
  }
};
const salvarArea = (id: number | null) => {
  try {
    if (id == null) window.sessionStorage.removeItem(chaveArea());
    else window.sessionStorage.setItem(chaveArea(), String(id));
  } catch {
    // modo privado / storage bloqueado: segue sem lembrar
  }
};

interface FuncionarioLista {
  id: number;
  nome?: string;
  nomeCompleto?: string;
  area?: { id: number; nome?: string }[];
}

export interface ProfissionalAgenda extends ProfissionalComArea {
  id: number;
}

const AgendaView = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [detalhe, setDetalhe] = useState<AgendamentoAgenda | null>(null);
  const [cobrando, setCobrando] = useState<AgendamentoAgenda | null>(null);
  const [movendo, setMovendo] = useState<PedidoMover | null>(null);
  const [painelAberto, setPainelAberto] = useState(false);
  const [dadosAgendamento, setDadosAgendamento] = useState({ profissional: "", hora: "" });
  const [intervaloTempo, setIntervaloTempo] = useState("60");
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  // Links dos avisos (sininho) abrem a agenda num dia: /agenda?data=AAAA-MM-DD
  const { data: dataDaUrl } = useSearch({ strict: false }) as { data?: string };
  useEffect(() => {
    const m = dataDaUrl ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataDaUrl) : null;
    if (m) setDataSelecionada(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  }, [dataDaUrl]);
  const [profissionaisSelecionados, setProfissionaisSelecionados] = useState<string[]>([]);
  const [areaSelecionada, setAreaSelecionadaEstado] = useState<number | null>(null);

  const funcionarios = useCarregar(() => funcionariosService.listar(), []);
  const agendamentos = useCarregar(() => agendamentosService.listar(), []);
  const podeArrastar = temPermissao("AGENDAMENTO_EDITAR");

  // sessionStorage só no navegador (depois de montar).
  useEffect(() => setAreaSelecionadaEstado(lerAreaSalva()), []);
  const setAreaSelecionada = useCallback((id: number | null) => {
    setAreaSelecionadaEstado(id);
    salvarArea(id);
  }, []);

  const equipe: ProfissionalAgenda[] = useMemo(
    () =>
      (funcionarios.dados as FuncionarioLista[]).map((f) => ({
        id: f.id,
        nome: f.nome ?? f.nomeCompleto ?? String(f.id),
        areas: (Array.isArray(f.area) ? f.area : []).map((a) => a.id),
      })),
    [funcionarios.dados],
  );
  // Identidade do profissional = id (dois profissionais podem ter o mesmo nome); o nome só aparece.
  const profissionais = useMemo(() => equipe.map((p) => String(p.id)), [equipe]);
  const nomes = useMemo(
    () => new Map(equipe.map((p) => [String(p.id), p.nome] as const)),
    [equipe],
  );

  // Áreas que têm ao menos um profissional (vêm junto de GET /funcionarios).
  const areas: AreaFiltro[] = useMemo(() => {
    const mapa = new Map<number, string>();
    for (const f of funcionarios.dados as FuncionarioLista[]) {
      for (const a of Array.isArray(f.area) ? f.area : []) {
        if (a?.id != null && !mapa.has(a.id)) mapa.set(a.id, a.nome || `Área ${a.id}`);
      }
    }
    return [...mapa]
      .map(([id, nome]) => ({ id, nome }))
      .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"));
  }, [funcionarios.dados]);

  // Área guardada que não existe mais (ou de outra equipe): volta para "todas".
  const areaValida =
    areaSelecionada != null && areas.some((a) => a.id === areaSelecionada) ? areaSelecionada : null;

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

  const listadosNoFiltro = useMemo(
    () => profissionaisDaArea(equipe, areaValida),
    [equipe, areaValida],
  );

  const toggleProfissional = (chave: string) => {
    setProfissionaisSelecionados((atual) =>
      atual.includes(chave) ? atual.filter((p) => p !== chave) : [...atual, chave],
    );
  };

  // "Todos" vale para os profissionais listados (os da área escolhida); os outros ficam como estão.
  const setTodosProfissionais = (marcar: boolean) => {
    setProfissionaisSelecionados((atual) =>
      marcar
        ? [...atual, ...listadosNoFiltro.filter((p) => !atual.includes(p))]
        : atual.filter((p) => !listadosNoFiltro.includes(p)),
    );
  };

  const dataFormatada = dataSelecionada.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dataIso = isoDoDia(dataSelecionada);

  const colunasProfissionais = useMemo(
    () => colunasVisiveis(equipe, profissionaisSelecionados, areaValida),
    [equipe, profissionaisSelecionados, areaValida],
  );

  const agendamentosDoDia = useMemo(
    () => agendamentos.dados.filter((ag) => ag.data === dataFormatada),
    [agendamentos.dados, dataFormatada],
  );
  const agendamentosFiltrados = useMemo(
    () => agendamentosDoDia.filter((ag) => colunasProfissionais.includes(ag.chaveProfissional)),
    [agendamentosDoDia, colunasProfissionais],
  );
  const servicosDoDia = useMemo(
    () => [...new Set(agendamentosDoDia.map((ag) => ag.servico).filter(Boolean))].sort(),
    [agendamentosDoDia],
  );

  // Callbacks estáveis: a grade é memo e não re-renderiza quando só um modal abre/fecha.
  const handleCliqueHorario = useCallback((profissional: string, hora: string) => {
    setDadosAgendamento({ profissional, hora });
    setModalAberto(true);
  }, []);

  const handleMover = useCallback(
    (agendamento: AgendamentoAgenda, chave: string, hora: string) => {
      const idFuncionario = Number(chave);
      if (!Number.isFinite(idFuncionario)) return;
      const profissional = nomes.get(chave) ?? chave;
      setMovendo({ agendamento, profissional, destino: { data: dataIso, hora, idFuncionario } });
    },
    [nomes, dataIso],
  );

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
        texto={
          areaValida == null
            ? "Marque ao menos um profissional em “Profissionais” para ver a agenda."
            : "Nenhum profissional marcado nesta área. Troque a área ou marque um profissional."
        }
      />
    );
  } else {
    conteudo = (
      <AgendaGrid
        profissionais={colunasProfissionais}
        nomes={nomes}
        agendamentos={agendamentosFiltrados}
        intervalo={intervaloTempo}
        onCellClick={handleCliqueHorario}
        onAgendamentoClick={setDetalhe}
        dataIso={dataIso}
        podeArrastar={podeArrastar}
        onMover={handleMover}
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
          profissionais={listadosNoFiltro}
          nomes={nomes}
          profissionaisSelecionados={profissionaisSelecionados}
          toggleProfissional={toggleProfissional}
          setTodosProfissionais={setTodosProfissionais}
          servicosDoDia={servicosDoDia}
          areas={areas}
          areaSelecionada={areaValida}
          setAreaSelecionada={setAreaSelecionada}
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
        profissionais={equipe}
        onFechar={() => setDetalhe(null)}
        onAlterado={() => agendamentos.recarregar()}
        onFecharAtendimento={(a) => {
          setDetalhe(null);
          setCobrando(a);
        }}
      />

      <MoverAgendamentoModal
        pedido={movendo}
        onFechar={() => setMovendo(null)}
        onMovido={() => agendamentos.recarregar()}
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
