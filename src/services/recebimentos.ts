// @requisito RE-09 RO-15 RO-23 RNF-02 RNF-06
import api from "@/config/axios";
import type { FormaPagamento } from "@/services/financeiro";

export type StatusRecebimento = "ABERTO" | "RECEBIDO";

export interface Recebimento {
  id: number;
  idCliente: number;
  nomeCliente: string;
  nome: string;
  descricao?: string | null;
  valor: number;
  vencimento: string;
  status: StatusRecebimento;
  vencido: boolean;
  dataRecebimento?: string | null;
  forma?: FormaPagamento | null;
  criadoEm: string;
  parcela: number;
  totalParcelas: number;
  grupo: string;
  entrouNoCaixa: boolean;
}

export interface ListaRecebimentos {
  de: string;
  ate: string;
  resumo: { emAberto: number; vencido: number; recebido: number };
  itens: Recebimento[];
}

export interface PendenciasCliente {
  quantidade: number;
  totalEmAberto: number;
  totalVencido: number;
  maisAntigoVencimento?: string | null;
}

export interface SalvarRecebimento {
  idCliente: number;
  nome: string;
  descricao?: string;
  valor: number;
  vencimento: string;
  parcelas?: number;
}

export interface FiltroRecebimentos {
  de: string;
  ate: string;
  status?: StatusRecebimento;
  cliente?: number;
}

export const recebimentosService = {
  listar: (filtro: FiltroRecebimentos) =>
    api.get<ListaRecebimentos>("/recebimentos", { params: filtro }).then((r) => r.data),
  pendencias: (idCliente: number) =>
    api
      .get<PendenciasCliente>("/recebimentos/pendencias", { params: { cliente: idCliente } })
      .then((r) => r.data),
  criar: (dados: SalvarRecebimento) =>
    api.post<Recebimento[]>("/recebimentos", dados).then((r) => r.data),
  atualizar: (id: number, dados: SalvarRecebimento) =>
    api.put<Recebimento>(`/recebimentos/${id}`, dados).then((r) => r.data),
  excluir: (id: number, todasAsParcelas = false) =>
    api
      .delete<{ excluidos: number }>(`/recebimentos/${id}`, { params: { todasAsParcelas } })
      .then((r) => r.data),
  receber: (id: number, forma: FormaPagamento, data: string | null, entrouNoCaixa: boolean) =>
    api
      .post<Recebimento>(`/recebimentos/${id}/receber`, { forma, data, entrouNoCaixa })
      .then((r) => r.data),
  desfazer: (id: number) =>
    api.post<Recebimento>(`/recebimentos/${id}/desfazer`).then((r) => r.data),
};
