import React from "react";

/**
 * Logo do Agendly em SVG.
 * - Símbolo: folha de calendário (com as argolas) e um "A" em chevron; o ponto
 *   marca um horário. Grade de 24 × 24.
 * - Variantes: "horizontal" (símbolo + nome), "simbolo" e "auto" (horizontal que
 *   vira só símbolo abaixo de 360 px). Tema escuro: as cores vêm dos tokens
 *   (--marca e currentColor), então acompanham o tema; "claro" força branco
 *   para uso sobre foto/fundo escuro.
 * - A altura vem de --logo-altura (24–32 px); a largura sai do viewBox, então o
 *   logo nunca é esticado.
 */

type Variante = "horizontal" | "simbolo" | "auto";

interface LogoProps {
  variante?: Variante;
  /** Força versão branca (sobre foto ou superfície escura). */
  claro?: boolean;
  /** Nome acessível; passe "" quando o logo for decorativo. */
  titulo?: string;
  className?: string;
}

const COR_SIMBOLO = "var(--marca)";

function Simbolo({ claro }: { claro?: boolean }) {
  const fundo = claro ? "#ffffff" : COR_SIMBOLO;
  const traco = claro ? "var(--marca)" : "#ffffff";
  return (
    <>
      {/* argolas */}
      <rect x="6.5" y="1" width="3" height="5.5" rx="1.5" fill={fundo} />
      <rect x="14.5" y="1" width="3" height="5.5" rx="1.5" fill={fundo} />
      {/* folha */}
      <rect x="2" y="4" width="20" height="19" rx="5" fill={fundo} />
      {/* "A" em chevron + ponto de horário */}
      <path
        d="M7.25 19 12 9.25 16.75 19"
        fill="none"
        stroke={traco}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="16" r="1.35" fill={traco} />
    </>
  );
}

function SvgSimbolo({ claro, titulo }: { claro?: boolean; titulo: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role={titulo ? "img" : undefined}
      aria-label={titulo || undefined}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      <Simbolo claro={claro} />
    </svg>
  );
}

function SvgHorizontal({ claro, titulo }: { claro?: boolean; titulo: string }) {
  // Nome alinhado na mesma linha de base dos itens da navbar (y = 17.5 na grade de 24).
  return (
    <svg
      viewBox="0 0 104 24"
      role={titulo ? "img" : undefined}
      aria-label={titulo || undefined}
      aria-hidden={titulo ? undefined : true}
      focusable="false"
    >
      <Simbolo claro={claro} />
      <text
        x="30"
        y="18"
        fill="currentColor"
        fontFamily="Inter, 'Segoe UI', system-ui, sans-serif"
        fontSize="17"
        fontWeight="600"
        letterSpacing="-0.3"
      >
        Agendly
      </text>
    </svg>
  );
}

export function Logo({ variante = "auto", claro, titulo = "Agendly", className = "" }: LogoProps) {
  const classe = `logo ${claro ? "logo--claro" : ""} logo--${variante} ${className}`.trim();
  if (variante === "simbolo") {
    return (
      <span className={classe}>
        <SvgSimbolo claro={claro} titulo={titulo} />
      </span>
    );
  }
  if (variante === "horizontal") {
    return (
      <span className={classe}>
        <SvgHorizontal claro={claro} titulo={titulo} />
      </span>
    );
  }
  // auto: horizontal; abaixo de 360 px troca para o símbolo (CSS em components.css)
  return (
    <span className={classe}>
      <span className="logo__horizontal">
        <SvgHorizontal claro={claro} titulo={titulo} />
      </span>
      <span className="logo__simbolo">
        <SvgSimbolo claro={claro} titulo={titulo} />
      </span>
    </span>
  );
}

export default Logo;
