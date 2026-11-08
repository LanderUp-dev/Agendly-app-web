import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/* ---------------------------------------------------------- PageHeader */
interface PageHeaderProps {
  titulo: string;
  descricao?: React.ReactNode;
  /** Link "voltar" acima do título. */
  voltar?: { to: string; rotulo: string };
  acoes?: React.ReactNode;
}

export function PageHeader({ titulo, descricao, voltar, acoes }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {voltar && (
          <Link to={voltar.to} className="page-header__voltar">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden="true" />
            {voltar.rotulo}
          </Link>
        )}
        <h1 className="page-header__titulo">{titulo}</h1>
        {descricao && <p className="page-header__descricao">{descricao}</p>}
      </div>
      {acoes && <div className="page-header__acoes">{acoes}</div>}
    </header>
  );
}

/* ---------------------------------------------------------------- Card */
interface CardProps extends React.HTMLAttributes<HTMLElement> {
  semPadding?: boolean;
  como?: "div" | "section";
}

export function Card({ semPadding, como = "div", className = "", children, ...resto }: CardProps) {
  const Tag = como;
  return (
    <Tag className={`card ${semPadding ? "card--sem-padding" : ""} ${className}`.trim()} {...resto}>
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------- Badge */
interface BadgeProps {
  tom?: "neutro" | "marca" | "erro" | "aviso";
  children: React.ReactNode;
}

export function Badge({ tom = "neutro", children }: BadgeProps) {
  return (
    <span className={`badge ${tom !== "neutro" ? `badge--${tom}` : ""}`.trim()}>{children}</span>
  );
}
