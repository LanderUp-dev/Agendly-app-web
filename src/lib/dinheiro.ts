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

/** Número para o campo de texto, sem o R$: 12.5 -> "12,50"; 1234.5 -> "1.234,50". */
export const paraCampo = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Limpa o que a pessoa está digitando num campo de valor: só números e uma vírgula com até duas
 * casas. Ponto usado como centavos ("12.5") vira vírgula; ponto de milhar ("1.234") é mantido.
 * Não completa nada (isso fica para valorAoSair), para não atrapalhar a digitação.
 */
export function valorDigitado(texto: string | null | undefined): string {
  const t = (texto ?? "").replace(/[^\d.,]/g, "");
  if (t.includes(",")) {
    const [inteiro, ...resto] = t.replace(/\./g, "").split(",");
    return `${inteiro},${resto.join("").slice(0, 2)}`;
  }
  if (/^\d{1,3}(\.\d{3})+$/.test(t)) return t;
  const p = t.lastIndexOf(".");
  if (p < 0) return t;
  return `${t.slice(0, p).replace(/\./g, "")},${t.slice(p + 1, p + 3)}`;
}

/** Ao sair do campo: "12" -> "12,00"; "1234,5" -> "1.234,50". Vazio ou inválido = "". */
export function valorAoSair(texto: string | null | undefined): string {
  const n = lerValor(valorDigitado(texto));
  return n === null ? "" : paraCampo(n);
}

/** O que o campo mostra: com "R$" e, fora da edição, já completo ("R$ 1.234,50"). */
export function valorParaMostrar(texto: string | null | undefined, editando: boolean): string {
  const t = texto ?? "";
  if (!t) return "";
  const n = editando ? null : lerValor(t);
  return `R$ ${n === null ? t : paraCampo(n)}`;
}

/** Soma em centavos (evita 0,1 + 0,2 = 0,30000000000000004). */
export const somar = (valores: number[]) =>
  valores.reduce((t, v) => t + Math.round(v * 100), 0) / 100;
