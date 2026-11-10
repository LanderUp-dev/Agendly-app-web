/**
 * Marca do Agendly: só o nome, em texto (sem símbolo). Direção "Navalha" (Hallmark):
 * o nome em Gloock, a mesma serifa dos títulos da home.
 * - A altura vem de --logo-altura; o texto acompanha a cor do contexto (currentColor),
 *   então funciona no tema claro, no escuro e sobre o verde da home.
 * - `variante` e `claro` continuam aceitos para não quebrar quem já usa o componente.
 */

type Variante = "horizontal" | "simbolo" | "auto";

interface LogoProps {
  variante?: Variante;
  /** Força a versão clara (sobre fundo escuro). */
  claro?: boolean;
  /** Nome acessível; passe "" quando o nome for decorativo (ex.: dentro de um link já rotulado). */
  titulo?: string;
  className?: string;
}

export function Logo({ variante = "auto", claro, titulo = "Agendly", className = "" }: LogoProps) {
  const classe = `logo ${claro ? "logo--claro" : ""} logo--${variante} ${className}`.trim();
  const decorativo = titulo === "";
  return (
    <span
      className={classe}
      aria-hidden={decorativo ? true : undefined}
      aria-label={!decorativo && titulo !== "Agendly" ? titulo : undefined}
    >
      Agendly
    </span>
  );
}

export default Logo;
