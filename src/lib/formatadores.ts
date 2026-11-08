/** Formatação só para EXIBIÇÃO (os payloads continuam só com dígitos). */
import { somenteDigitos } from "./validators";

const VAZIO = "—";

export function formatarCPF(valor?: string | null): string {
  const d = somenteDigitos(valor);
  if (d.length !== 11) return valor || VAZIO;
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatarCNPJ(valor?: string | null): string {
  const d = somenteDigitos(valor);
  if (d.length !== 14) return valor || VAZIO;
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatarTelefone(valor?: string | null): string {
  const d = somenteDigitos(valor);
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return valor || VAZIO;
}

/** yyyy-MM-dd -> dd/MM/yyyy */
export function formatarData(valor?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valor || VAZIO;
}

export function formatarMoeda(valor?: number | null): string {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return VAZIO;
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function nomeCompleto(...partes: (string | null | undefined)[]): string {
  return partes.filter(Boolean).join(" ") || VAZIO;
}
