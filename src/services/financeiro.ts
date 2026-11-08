// @requisito RE-06 RE-07 RE-10 RO-42
import api from "@/config/axios";

/** Chaves iguais a com.agendly.app.financeiro.model.entity.FormaPagamento. */
export type FormaPagamento = "DINHEIRO" | "PIX" | "CARTAO_DEBITO" | "CARTAO_CREDITO" | "OUTRO";

export const FORMAS_PAGAMENTO: { forma: FormaPagamento; descricao: string }[] = [
  { forma: "DINHEIRO", descricao: "Dinheiro" },
  { forma: "PIX", descricao: "Pix" },
  { forma: "CARTAO_DEBITO", descricao: "Cartão de débito" },
  { forma: "CARTAO_CREDITO", descricao: "Cartão de crédito" },
  { forma: "OUTRO", descricao: "Outro" },
];

export const descricaoForma = (f: string) =>
  FORMAS_PAGAMENTO.find((x) => x.forma === f)?.descricao ?? f;

export type TipoMovimento =
  | "SUPRIMENTO"
  | "SANGRIA"
  | "VENDA"
  | "ESTORNO"
  | "RECEBIMENTO"
  | "DESPESA"
  | "SALARIO"
  | "ADIANTAMENTO";

export const ROTULO_MOVIMENTO: Record<TipoMovimento, string> = {
  SUPRIMENTO: "Suprimento",
  SANGRIA: "Sangria",
  VENDA: "Venda",
  ESTORNO: "Estorno",
  RECEBIMENTO: "Recebimento",
  DESPESA: "Despesa",
  SALARIO: "Salário",
  ADIANTAMENTO: "Adiantamento",
};

export interface Movimento {
  id: number;
  tipo: TipoMovimento;
  entrada: boolean;
  forma: FormaPagamento;
  valor: number;
  descricao?: string | null;
  criadoEm: string;
  idComanda?: number | null;
}

export interface ComandaResumo {
  id: number;
  status: "FECHADA" | "CANCELADA";
  idCaixa: number;
  idAgendamento?: number | null;
  idCliente?: number | null;
  cliente?: string | null;
  subtotal: number;
  desconto: number;
  acrescimo: number;
  total: number;
  troco: number;
  criadaEm: string;
  motivoCancelamento?: string | null;
  itens: {
    idServico: number;
    servico: string;
    idFuncionario: number;
    funcionario: string;
    valor: number;
  }[];
  pagamentos: { forma: FormaPagamento; valor: number }[];
}

export interface Caixa {
  id: number;
  status: "ABERTO" | "FECHADO";
  abertoEm: string;
  fechadoEm?: string | null;
  valorInicial: number;
  valorContado?: number | null;
  observacao?: string | null;
  suprimentos: number;
  sangrias: number;
  vendas: number;
  vendasPorForma: Partial<Record<FormaPagamento, number>>;
  outrasEntradas: number;
  outrasSaidas: number;
  saldoDinheiro: number;
  diferenca?: number | null;
  movimentos: Movimento[];
  comandas: ComandaResumo[];
}

export interface NovaComanda {
  idAgendamento?: number;
  idCliente?: number;
  itens: { idServico: number; idFuncionario: number; valor?: number }[];
  desconto?: number;
  acrescimo?: number;
  pagamentos: { forma: FormaPagamento; valor: number }[];
}

export interface Painel {
  de: string;
  ate: string;
  faturamento: number;
  atendimentos: number;
  ticketMedio: number;
  descontos: number;
  clientesAtendidos: number;
  porDia: { data: string; faturamento: number; atendimentos: number }[];
  porProfissional: {
    idFuncionario: number;
    nome: string;
    servicos: number;
    valor: number;
    parteProfissional: number;
  }[];
  porServico: { idServico: number; nome: string; quantidade: number; valor: number }[];
  porForma: { forma: FormaPagamento; descricao: string; valor: number }[];
  agendamentosPorStatus: Record<string, number>;
  agendamentos: number;
  taxaFaltas: number;
}

export const caixaService = {
  /** null quando não há caixa aberto (204). */
  atual: () =>
    api.get<Caixa | "">("/caixas/atual").then((r) => (r.status === 204 || !r.data ? null : r.data)),
  historico: (de: string, ate: string) =>
    api.get<Caixa[]>("/caixas", { params: { de, ate } }).then((r) => r.data),
  buscar: (id: number) => api.get<Caixa>(`/caixas/${id}`).then((r) => r.data),
  abrir: (valorInicial: number) => api.post<Caixa>("/caixas", { valorInicial }).then((r) => r.data),
  movimentar: (tipo: "SUPRIMENTO" | "SANGRIA", valor: number, descricao?: string) =>
    api.post<Movimento>("/caixas/atual/movimentos", { tipo, valor, descricao }).then((r) => r.data),
  fechar: (valorContado: number | null, observacao?: string) =>
    api.post<Caixa>("/caixas/atual/fechar", { valorContado, observacao }).then((r) => r.data),
  reabrir: (id: number) => api.post<Caixa>(`/caixas/${id}/reabrir`).then((r) => r.data),
};

export const comandaService = {
  fechar: (dados: NovaComanda) => api.post<ComandaResumo>("/comandas", dados).then((r) => r.data),
  cancelar: (id: number, motivo: string) =>
    api.post<ComandaResumo>(`/comandas/${id}/cancelar`, { motivo }).then((r) => r.data),
};

export const painelService = {
  carregar: (de: string, ate: string) =>
    api.get<Painel>("/painel", { params: { de, ate } }).then((r) => r.data),
};
