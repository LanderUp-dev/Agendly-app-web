// @requisito RO-43
import axios from "axios";
import api, { BASE_URL } from "@/config/axios";
import { getToken, tokenExpirado } from "@/lib/auth";

/** Chaves iguais a com.agendly.app.notificacao.model.entity.TipoNotificacao. */
export type TipoNotificacao =
  "AGENDAMENTO_CRIADO" | "AGENDAMENTO_CANCELADO" | "FIDELIDADE_MARCO" | "CAIXA_ABERTO_DIA_ANTERIOR";

export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  /** Rota do front (ex.: /agenda?data=2026-11-10). */
  link?: string | null;
  criadaEm: string;
  lidaEm?: string | null;
  lida: boolean;
}

export interface PaginaNotificacoes {
  itens: Notificacao[];
  pagina: number;
  tamanho: number;
  total: number;
  totalPaginas: number;
  temMais: boolean;
}

/** O backend limita a 50 por página. */
export const TAMANHO_MAXIMO = 50;

/**
 * Cliente "silencioso" só para o polling da contagem: sem o interceptor global de erros,
 * para não mostrar toast (nem redirecionar) a cada minuto se a API cair. O sino mostra o erro
 * discretamente e as ações do usuário (abrir, marcar) usam o `api` normal.
 */
const silencioso = axios.create({ baseURL: BASE_URL, timeout: 10000 });
silencioso.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !tokenExpirado(token)) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

export const notificacoesService = {
  listar: (params: { pagina?: number; tamanho?: number; naoLidas?: boolean } = {}) =>
    api
      .get<PaginaNotificacoes>("/notificacoes", {
        params: {
          pagina: params.pagina ?? 0,
          tamanho: Math.min(params.tamanho ?? 20, TAMANHO_MAXIMO),
          naoLidas: params.naoLidas ? true : undefined,
        },
      })
      .then((r) => r.data),

  /** Leve: usada a cada 60 s pelo sino. */
  contarNaoLidas: () =>
    silencioso
      .get<{ naoLidas: number }>("/notificacoes/nao-lidas/contagem")
      .then((r) => r.data.naoLidas),

  marcarLida: (id: number) => api.post<Notificacao>(`/notificacoes/${id}/lida`).then((r) => r.data),

  marcarTodasLidas: () =>
    api.post<{ atualizadas: number }>("/notificacoes/lidas").then((r) => r.data.atualizadas),
};

/** Disparado quando uma tela marca avisos como lidos: o sino reconsulta a contagem na hora. */
export const EVENTO_AVISOS_MUDARAM = "agendly:avisos-mudaram";

export function avisarQueAvisosMudaram(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO_AVISOS_MUDARAM));
}

/** "9+" acima de 9; vazio quando não há não lidas. */
export function rotuloContagem(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "";
  return n > 9 ? "9+" : String(n);
}

/** Texto do aria-label do botão do sino. */
export function descricaoSino(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "Avisos: nenhum aviso novo";
  return n === 1 ? "Avisos: 1 aviso não lido" : `Avisos: ${n} avisos não lidos`;
}

const FORMATO_DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** "agora", "há 5 min", "há 3 h" ou a data (dd/mm hh:mm) para avisos com mais de um dia. */
export function quandoFoi(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  const minutos = Math.floor((agora.getTime() - data.getTime()) / 60000);
  if (minutos < 1) return "agora";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return FORMATO_DATA_HORA.format(data);
}
