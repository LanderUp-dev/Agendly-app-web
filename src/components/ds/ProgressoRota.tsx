import React, { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/** Barra fina no topo durante a troca de rota (só aparece se passar de 150 ms). */
export function ProgressoRota() {
  const carregando = useRouterState({ select: (s) => s.status === "pending" || s.isLoading });
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    if (!carregando) {
      setVisivel(false);
      return;
    }
    const t = setTimeout(() => setVisivel(true), 150);
    return () => clearTimeout(t);
  }, [carregando]);

  if (!visivel) return null;
  return (
    <div
      className="progresso-rota"
      role="progressbar"
      aria-label="Carregando página"
      data-cy="progresso-rota"
    >
      <div className="progresso-rota__barra" />
    </div>
  );
}

export default ProgressoRota;
