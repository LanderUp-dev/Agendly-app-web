// @requisito RE-09 RO-15
import { reais } from "@/lib/dinheiro";
import type { PendenciasCliente } from "@/services/recebimentos";

/** "2026-11" -> { de: "2026-11-01", ate: "2026-11-30" }. */
export function periodoDoMes(mes: string): { de: string; ate: string } {
  const [ano, m] = mes.split("-").map(Number);
  const ultimo = new Date(ano, m, 0).getDate();
  return { de: `${mes}-01`, ate: `${mes}-${String(ultimo).padStart(2, "0")}` };
}

/** Mês atual no formato do input type="month" (yyyy-mm). */
export const mesAtual = (hoje = new Date()) =>
  `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

/** "2026-11-08" -> "08/11/2026". */
export const dataBR = (iso?: string | null) => {
  if (!iso) return "—";
  const [a, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
};

/** Texto do aviso de pendência; null quando o cliente não deve nada. */
export function textoPendencia(p: PendenciasCliente | null | undefined): string | null {
  if (!p || p.quantidade <= 0) return null;
  const contas = p.quantidade === 1 ? "1 conta em aberto" : `${p.quantidade} contas em aberto`;
  let texto = `Este cliente tem ${contas} (${reais(p.totalEmAberto)})`;
  if (p.totalVencido > 0) {
    texto += `, sendo ${reais(p.totalVencido)} vencido`;
    if (p.maisAntigoVencimento) texto += ` desde ${dataBR(p.maisAntigoVencimento)}`;
  }
  return `${texto}.`;
}
