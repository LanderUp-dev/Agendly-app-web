// @requisito RU-02
import type React from "react";
/**
 * Cores de agendamento: cada serviço recebe um tom fixo da paleta (tokens
 * --ag-*-fundo/texto/borda, todos com contraste AA), de forma estável pelo nome.
 * A legenda da agenda usa a mesma função, então cor e legenda sempre batem.
 */
export const TONS = ["verde", "azul", "ambar", "roxo", "rosa", "cinza"] as const;
export type Tom = (typeof TONS)[number];

export function tomDoServico(nomeServico?: string | null): Tom {
  const nome = (nomeServico ?? "").trim().toLowerCase();
  if (!nome) return "cinza";
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash = (hash * 31 + nome.charCodeAt(i)) >>> 0;
  // "cinza" fica reservado para "sem serviço"
  return TONS[hash % (TONS.length - 1)];
}

export function estiloDoTom(tom: Tom): React.CSSProperties {
  return {
    backgroundColor: `var(--ag-${tom}-fundo)`,
    color: `var(--ag-${tom}-texto)`,
    borderLeftColor: `var(--ag-${tom}-borda)`,
  };
}
