import { useEffect, useState } from "react";

/**
 * Fases de feedback de carregamento (regra de tempo do design system):
 * - "oculto":    < atraso (300 ms) — não mostra nada, evita piscar.
 * - "indicador": até 2 s — skeleton ou spinner discreto.
 * - "mensagem":  2 s a 10 s — mensagem de contexto ("Carregando agenda...").
 * - "lento":     > 10 s — aviso de lentidão com "Tentar novamente".
 */
export type FaseCarregamento = "oculto" | "indicador" | "mensagem" | "lento";

export const TEMPOS_CARREGAMENTO = {
  atraso: 300,
  mensagem: 2000,
  lento: 10000,
} as const;

export function useAtrasoLoading(
  carregando: boolean,
  atraso: number = TEMPOS_CARREGAMENTO.atraso,
): FaseCarregamento {
  const [fase, setFase] = useState<FaseCarregamento>("oculto");

  useEffect(() => {
    if (!carregando) {
      setFase("oculto");
      return;
    }
    setFase("oculto");
    const timers = [
      setTimeout(() => setFase("indicador"), atraso),
      setTimeout(() => setFase("mensagem"), TEMPOS_CARREGAMENTO.mensagem),
      setTimeout(() => setFase("lento"), TEMPOS_CARREGAMENTO.lento),
    ];
    return () => timers.forEach(clearTimeout);
  }, [carregando, atraso]);

  return fase;
}

export default useAtrasoLoading;
