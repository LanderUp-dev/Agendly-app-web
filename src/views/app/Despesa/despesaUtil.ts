// @requisito RE-08 RNR-18
/** Funções puras da tela de despesas (testadas em despesaUtil.test.ts). */

/** Mês atual no formato do <input type="month">: "2026-11". */
export const mesAtual = (hoje = new Date()) =>
  `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

/** "2026-11" -> { de: "2026-11-01", ate: "2026-11-30" } */
export function periodoDoMes(mes: string): { de: string; ate: string } {
  const [ano, m] = mes.split("-").map(Number);
  const ultimo = new Date(ano, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return { de: `${ano}-${mm}-01`, ate: `${ano}-${mm}-${String(ultimo).padStart(2, "0")}` };
}

/**
 * Prévia das parcelas, igual ao backend: total dividido em centavos,
 * a sobra do arredondamento na 1ª. Vazio se não dá para dividir.
 */
export function dividirParcelas(total: number, parcelas: number): number[] {
  const centavos = Math.round(total * 100);
  if (!Number.isInteger(parcelas) || parcelas < 1 || centavos <= 0) return [];
  const base = Math.floor(centavos / parcelas);
  if (base <= 0) return [];
  const sobra = centavos - base * parcelas;
  return Array.from({ length: parcelas }, (_, i) => (i === 0 ? base + sobra : base) / 100);
}

/** "2026-11-08" -> "08/11/2026" (sem fuso: a data vem pura do backend). */
export const dataBR = (iso?: string | null) => {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};
