// @requisito RE-14
/** Planos mostrados na página inicial: valores do banco (GET /planos) com valores de partida. */

export interface PlanoHome {
  codigo: string;
  nome: string;
  descricao: string;
  valorMensal: number;
  limiteProfissionais: number | null;
}

/**
 * Valores de partida (os mesmos que o backend cria em PlanosIniciaisConfig): aparecem sem
 * JavaScript e enquanto a API não responde. Com a API no ar, valem os planos do banco.
 */
export const PLANOS_PADRAO: PlanoHome[] = [
  {
    codigo: "SOLO",
    nome: "Solo",
    descricao: "Para profissionais autônomos",
    valorMensal: 59,
    limiteProfissionais: 1,
  },
  {
    codigo: "EQUIPE",
    nome: "Equipe",
    descricao: "Para salões e barbearias",
    valorMensal: 149,
    limiteProfissionais: 6,
  },
];

/** Aceita só planos com nome e preço válidos; ordena do mais barato para o mais caro. */
export function normalizarPlanos(dados: unknown): PlanoHome[] {
  if (!Array.isArray(dados)) return [];
  return dados
    .map((p) => ({
      codigo: String(p?.codigo ?? p?.id ?? ""),
      nome: String(p?.nome ?? "").trim(),
      descricao: String(p?.descricao ?? "").trim(),
      valorMensal: Number(p?.valorMensal),
      limiteProfissionais:
        p?.limiteProfissionais == null || Number.isNaN(Number(p.limiteProfissionais))
          ? null
          : Number(p.limiteProfissionais),
    }))
    .filter((p) => p.nome && Number.isFinite(p.valorMensal) && p.valorMensal >= 0)
    .sort((a, b) => a.valorMensal - b.valorMensal);
}

/** "59" para valor redondo, "59,90" quando tem centavos. */
export function precoSemSimbolo(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(valor) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function limiteDoPlano(limite: number | null): string {
  if (limite == null || limite <= 0) return "Profissionais ilimitados";
  if (limite === 1) return "1 profissional";
  return "Até " + limite + " profissionais, com comissão e salário por profissional";
}
