// @requisito RE-08 RO-22 RNR-16 RNR-18 RNF-01 RNF-05
import api from "@/config/axios";
import type { FormaPagamento } from "@/services/financeiro";

export type StatusDespesa = "ABERTA" | "PAGA";

export interface Despesa {
  id: number;
  nome: string;
  descricao?: string | null;
  valor: number;
  vencimento: string;
  status: StatusDespesa;
  /** Aberta e com vencimento antes de hoje (calculado no backend). */
  vencida: boolean;
  dataPagamento?: string | null;
  formaPagamento?: FormaPagamento | null;
  saiuDoCaixa: boolean;
  criadaEm: string;
  parcela: number;
  totalParcelas: number;
  grupo: string;
  cobrancistas: { id: number; nome: string }[];
}

export interface ResumoDespesas {
  totalAberto: number;
  totalVencido: number;
  totalPago: number;
}

export interface ListaDespesas {
  de: string;
  ate: string;
  despesas: Despesa[];
  resumo: ResumoDespesas;
}

/** Criar: valor = total, dividido nas parcelas. Editar: parcelas é ignorado. */
export interface NovaDespesa {
  nome: string;
  descricao?: string;
  valor: number;
  vencimento: string;
  parcelas?: number;
  cobrancistas: number[];
}

export interface PagarDespesa {
  forma: FormaPagamento;
  data?: string;
  saiDoCaixa: boolean;
}

export const despesasService = {
  listar: (de: string, ate: string, status?: StatusDespesa) =>
    api
      .get<ListaDespesas>("/despesas", { params: { de, ate, status: status || undefined } })
      .then((r) => r.data),
  resumo: (de: string, ate: string) =>
    api.get<ResumoDespesas>("/despesas/resumo", { params: { de, ate } }).then((r) => r.data),
  criar: (dados: NovaDespesa) => api.post<Despesa[]>("/despesas", dados).then((r) => r.data),
  editar: (id: number, dados: NovaDespesa) =>
    api.put<Despesa>(`/despesas/${id}`, dados).then((r) => r.data),
  excluir: (id: number, todasAsParcelas = false) =>
    api
      .delete<{ excluidas: number }>(`/despesas/${id}`, { params: { todasAsParcelas } })
      .then((r) => r.data),
  pagar: (id: number, dados: PagarDespesa) =>
    api.post<Despesa>(`/despesas/${id}/pagar`, dados).then((r) => r.data),
  desfazerPagamento: (id: number) =>
    api.post<Despesa>(`/despesas/${id}/desfazer-pagamento`).then((r) => r.data),
};
