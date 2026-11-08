// @requisito RE-06 RE-07
/** R$ 1.234,56 */
export const reais = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Lê um valor digitado ("12,50", "1.234,5", "12.5", "R$ 10") como número.
 * Vazio ou inválido = null. Arredonda para centavos.
 */
export function lerValor(texto: string | null | undefined): number | null {
  let t = (texto ?? "").replace(/[R$\s]/g, "");
  if (!t) return null;
  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, ""); // 1.234 = mil duzentos e trinta e quatro
  }
  if (!/^-?\d*(\.\d*)?$/.test(t) || t === "." || t === "-") return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

/** Número para o campo de texto: 12.5 -> "12,50". */
export const paraCampo = (v: number) => v.toFixed(2).replace(".", ",");

/** Soma em centavos (evita 0,1 + 0,2 = 0,30000000000000004). */
export const somar = (valores: number[]) =>
  valores.reduce((t, v) => t + Math.round(v * 100), 0) / 100;
