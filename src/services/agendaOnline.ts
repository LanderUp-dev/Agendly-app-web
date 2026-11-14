// @requisito RO-44
import api from "@/config/axios";
import { publico } from "@/services/confirmacaoPublica";

/** Configuração do agendamento online da loja ativa (AgendaOnlineController no backend). */
export interface ConfigAgendaOnline {
  ativo: boolean;
  slug: string;
  antecedenciaMinutos: number;
  diasAFrente: number;
}

export const agendaOnlineService = {
  ver: () => api.get<ConfigAgendaOnline>("/agendamento-online").then((r) => r.data),
  salvar: (dados: Partial<ConfigAgendaOnline>) =>
    api.put<ConfigAgendaOnline>("/agendamento-online", dados).then((r) => r.data),
};

/** Endereço público da página de agendamento da loja. */
export function linkAgendar(
  slug: string | null | undefined,
  origem: string | undefined = typeof window === "undefined" ? undefined : window.location.origin,
): string | null {
  if (!slug || !origem) return null;
  return `${origem.replace(/\/+$/, "")}/agendar/${encodeURIComponent(slug)}`;
}

// ---------------------------------------------------------------- página pública (sem login)

export interface ProfissionalPublico {
  id: number;
  nome: string;
}

export interface ServicoPublico {
  id: number;
  nome: string;
  descricao?: string | null;
  preco?: number | null;
  duracaoMinutos: number;
  profissionais: ProfissionalPublico[];
}

export interface Vitrine {
  loja: string;
  cidade?: string | null;
  diasAFrente: number;
  /** yyyy-MM-dd no horário da loja. */
  hoje: string;
  servicos: ServicoPublico[];
}

export interface HorariosDoProfissional {
  idFuncionario: number;
  nome: string;
  /** HH:mm */
  horarios: string[];
}

export interface PedidoAgendamento {
  idServico: number;
  idFuncionario: number | null;
  /** yyyy-MM-dd */
  data: string;
  /** HH:mm */
  hora: string;
  nome: string;
  celular: string;
}

export interface Marcado {
  token: string;
  servico?: string | null;
  profissional?: string | null;
  data: string;
  hora: string;
}

const base = (slug: string) => `/publico/agenda/${encodeURIComponent(slug)}`;

export const agendaPublicaService = {
  vitrine: (slug: string) => publico.get<Vitrine>(base(slug)).then((r) => r.data),
  horarios: (slug: string, idServico: number, data: string, idFuncionario?: number | null) =>
    publico
      .get<HorariosDoProfissional[]>(`${base(slug)}/horarios`, {
        params: { servico: idServico, data, profissional: idFuncionario ?? undefined },
      })
      .then((r) => (Array.isArray(r.data) ? r.data : [])),
  agendar: (slug: string, pedido: PedidoAgendamento) =>
    publico.post<Marcado>(`${base(slug)}/agendamentos`, pedido).then((r) => r.data),
};

/** Horários de todos os profissionais juntos, sem repetir e em ordem ("qualquer profissional"). */
export function juntarHorarios(lista: HorariosDoProfissional[]): string[] {
  return [...new Set(lista.flatMap((p) => p.horarios ?? []))].sort();
}

const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export interface DiaDaAgenda {
  /** yyyy-MM-dd */
  iso: string;
  semana: string;
  /** dd/MM */
  dia: string;
}

/** Os dias que o cliente pode escolher: de hoje (da loja) até o limite configurado. */
export function diasDisponiveis(hojeIso: string, diasAFrente: number): DiaDaAgenda[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hojeIso);
  if (!m) return [];
  const total = Math.max(0, Math.min(90, Math.floor(diasAFrente)));
  const dias: DiaDaAgenda[] = [];
  for (let i = 0; i <= total; i++) {
    // Meio-dia: somar dias nunca cai na virada do horário de verão.
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + i, 12);
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    dias.push({
      iso: `${d.getFullYear()}-${mes}-${dia}`,
      semana: i === 0 ? "hoje" : i === 1 ? "amanhã" : DIAS_CURTOS[d.getDay()],
      dia: `${dia}/${mes}`,
    });
  }
  return dias;
}
