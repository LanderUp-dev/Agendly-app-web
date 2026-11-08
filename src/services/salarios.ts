// @requisito RO-01 RO-02 RO-03 RO-08 RND-03 RNR-05 RNR-06 RNR-07
import api from "@/config/axios";
import type { FormaPagamento } from "@/services/financeiro";

/** Linha da lista: quanto cada profissional tem a receber agora. */
export interface SalarioResumo {
  idFuncionario: number;
  nome: string;
  comissao: number;
  adiantamentosPendentes: number;
  aReceber: number;
  ultimoPagamento?: string | null;
}

export interface ItemExtrato {
  idComanda: number;
  data: string;
  cliente?: string | null;
  servico: string;
  valor: number;
  comissaoLoja: number;
  parteProfissional: number;
}

export interface Adiantamento {
  id: number;
  valor: number;
  forma: FormaPagamento;
  data: string;
  idPagamento?: number | null;
}

export interface Extrato {
  idFuncionario: number;
  nome: string;
  de: string;
  ate: string;
  periodoLimitado: boolean;
  itens: ItemExtrato[];
  valorItens: number;
  parteItens: number;
  adiantamentosPendentes: Adiantamento[];
  comissao: number;
  totalAdiantamentos: number;
  aReceber: number;
  ultimoPagamento?: string | null;
}

export interface PagamentoSalario {
  id: number;
  idFuncionario: number;
  nome: string;
  periodoInicio?: string | null;
  periodoFim: string;
  valorComissao: number;
  adiantamentosDescontados: number;
  valorPago: number;
  forma: FormaPagamento;
  saiuDoCaixa: boolean;
  pagoEm: string;
}

export interface Pagina<T> {
  itens: T[];
  pagina: number;
  tamanho: number;
  total: number;
  totalPaginas: number;
}

export const salarioService = {
  listar: () => api.get<SalarioResumo[]>("/salarios").then((r) => r.data),

  extrato: (idFuncionario: number) =>
    api.get<Extrato>(`/salarios/${idFuncionario}`).then((r) => r.data),

  pagamentos: (idFuncionario: number, pagina = 0, tamanho = 10) =>
    api
      .get<Pagina<PagamentoSalario>>(`/salarios/${idFuncionario}/pagamentos`, {
        params: { pagina, tamanho },
      })
      .then((r) => r.data),

  /** RO-02: saiDoCaixa = resposta de "Saiu do caixa aberto?". */
  pagar: (idFuncionario: number, forma: FormaPagamento, saiDoCaixa: boolean) =>
    api
      .post<PagamentoSalario>(`/salarios/${idFuncionario}/pagar`, { forma, saiDoCaixa })
      .then((r) => r.data),

  adiantar: (idFuncionario: number, valor: number, forma: FormaPagamento) =>
    api
      .post<Adiantamento>(`/salarios/${idFuncionario}/adiantamentos`, { valor, forma })
      .then((r) => r.data),
};
