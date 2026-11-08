import React from "react";
import { Link } from "@tanstack/react-router";

export type VarianteBotao = "primario" | "secundario" | "fantasma" | "perigo";

interface BaseProps {
  variante?: VarianteBotao;
  /** Ocupa a largura toda do contêiner. */
  bloco?: boolean;
  icone?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps
  extends BaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  /** Mostra spinner, troca o texto, desabilita e marca aria-busy (impede duplo clique). */
  carregando?: boolean;
  textoCarregando?: string;
}

const classes = (variante: VarianteBotao, bloco?: boolean, extra = "") =>
  ["btn", `btn-${variante}`, bloco ? "btn-bloco" : "", extra].filter(Boolean).join(" ");

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variante = "primario",
    bloco,
    icone,
    carregando = false,
    textoCarregando = "Salvando...",
    disabled,
    type = "button",
    className,
    children,
    ...resto
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes(variante, bloco, className)}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...resto}
    >
      {!carregando && icone}
      <span>{carregando ? textoCarregando : children}</span>
    </button>
  );
});

export interface ButtonLinkProps extends BaseProps {
  to: string;
  "data-cy"?: string;
}

/** Link com aparência de botão (navegação, não ação). */
export function ButtonLink({
  to,
  variante = "primario",
  bloco,
  icone,
  className,
  children,
  ...resto
}: ButtonLinkProps) {
  return (
    <Link to={to} className={classes(variante, bloco, className)} {...resto}>
      {icone}
      <span>{children}</span>
    </Link>
  );
}

export default Button;
