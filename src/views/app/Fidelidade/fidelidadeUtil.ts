// @requisito RND-05
import type { ProgressoFidelidade } from "@/services/fidelidade";

/** Percentual (0–100) do ciclo atual de fidelidade, para a barra de progresso. */
export function percentualCiclo(p: Pick<ProgressoFidelidade, "n" | "noCiclo">): number {
  if (!p.n || p.n <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((p.noCiclo / p.n) * 100)));
}

/** Frase da barra: "Faltam 3 visitas para 1 corte grátis". */
export function textoFaltam(p: Pick<ProgressoFidelidade, "faltam" | "recompensa">): string {
  const recompensa = p.recompensa?.trim() || "a recompensa";
  return p.faltam === 1
    ? `Falta 1 visita para ${recompensa}`
    : `Faltam ${p.faltam} visitas para ${recompensa}`;
}

/** Primeiro e último dia do mês (yyyy-mm-dd) de uma data "yyyy-mm". */
export function periodoDoMes(mes: string): { de: string; ate: string } {
  const [ano, m] = mes.split("-").map(Number);
  const ultimo = new Date(ano, m, 0).getDate();
  const mm = String(m).padStart(2, "0");
  return { de: `${ano}-${mm}-01`, ate: `${ano}-${mm}-${String(ultimo).padStart(2, "0")}` };
}
