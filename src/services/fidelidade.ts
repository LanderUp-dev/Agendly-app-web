// @requisito RO-04 RO-26 RO-27 RND-04 RND-05
import api from "@/config/axios";

export interface ConfigFidelidade {
  ativo: boolean;
  visitasParaRecompensa: number;
  recompensa: string | null;
  enviarEmail: boolean;
}

export interface ProgressoFidelidade {
  ativo: boolean;
  n: number;
  noCiclo: number;
  faltam: number;
  recompensasCompletas: number;
  recompensa: string | null;
}

export interface ComandaHistorico {
  id: number;
  data: string;
  servicos: string[];
  profissionais: string[];
  total: number;
  formasPagamento: string[];
}

export interface Pagina<T> {
  itens: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface HistoricoCliente {
  clienteId: number;
  nome: string;
  visitas: number;
  totalGasto: number;
  ticketMedio: number;
  ultimaVisita: string | null;
  fidelidade: ProgressoFidelidade;
  comandas: Pagina<ComandaHistorico>;
}

export interface MarcoFidelidade {
  id: number;
  clienteId: number;
  cliente: string;
  email: string | null;
  visitas: number;
  recompensa: string | null;
  criadoEm: string;
  emailEnviado: boolean;
}

export const MIN_VISITAS = 2;
export const MAX_VISITAS = 100;

export const fidelidadeService = {
  config: () => api.get<ConfigFidelidade>("/fidelidade").then((r) => r.data),
  salvar: (dados: ConfigFidelidade) =>
    api.put<ConfigFidelidade>("/fidelidade", dados).then((r) => r.data),
  marcos: (de: string, ate: string) =>
    api.get<MarcoFidelidade[]>("/fidelidade/marcos", { params: { de, ate } }).then((r) => r.data),
  historico: (clienteId: number, page = 0, size = 10) =>
    api
      .get<HistoricoCliente>(`/clientes/${clienteId}/historico`, { params: { page, size } })
      .then((r) => r.data),
};
