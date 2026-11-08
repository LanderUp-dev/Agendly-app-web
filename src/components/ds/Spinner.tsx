import React from "react";

interface SpinnerProps {
  tamanho?: "sm" | "md";
  /** Texto para leitor de tela; "" quando o contexto já anuncia o carregamento. */
  rotulo?: string;
  className?: string;
}

export function Spinner({ tamanho = "md", rotulo = "Carregando", className = "" }: SpinnerProps) {
  return (
    <span
      className={`spinner ${tamanho === "sm" ? "spinner--sm" : ""} ${className}`.trim()}
      role={rotulo ? "status" : undefined}
      aria-label={rotulo || undefined}
      aria-hidden={rotulo ? undefined : true}
    />
  );
}

export default Spinner;
