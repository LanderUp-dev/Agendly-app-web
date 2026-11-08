import React from "react";
import { AlertTriangle, Inbox, RotateCw } from "lucide-react";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { useAtrasoLoading } from "@/hooks/useAtrasoLoading";

/* ------------------------------------------------------------- Skeleton */
interface SkeletonProps {
  largura?: string | number;
  altura?: string | number;
  variante?: "texto" | "controle" | "bloco";
  className?: string;
  style?: React.CSSProperties;
}

/** Bloco cinza no tamanho do conteúdo final (evita layout shift). */
export function Skeleton({
  largura = "100%",
  altura,
  variante = "bloco",
  className = "",
  style,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton ${variante !== "bloco" ? `skeleton--${variante}` : ""} ${className}`.trim()}
      style={{ width: largura, height: altura, ...style }}
    />
  );
}

/* ----------------------------------------------------------- EmptyState */
interface EmptyStateProps {
  titulo: string;
  texto?: React.ReactNode;
  icone?: React.ReactNode;
  acao?: React.ReactNode;
}

export function EmptyState({ titulo, texto, icone, acao }: EmptyStateProps) {
  return (
    <div className="estado" data-cy="estado-vazio">
      <span className="estado__icone" aria-hidden="true">
        {icone ?? <Inbox size={22} strokeWidth={1.75} />}
      </span>
      <p className="estado__titulo">{titulo}</p>
      {texto && <p className="estado__texto">{texto}</p>}
      {acao && <div className="estado__acoes">{acao}</div>}
    </div>
  );
}

/* ----------------------------------------------------------- ErrorState */
interface ErrorStateProps {
  titulo?: string;
  mensagem?: string;
  onTentarNovamente?: () => void;
}

export function ErrorState({
  titulo = "Não foi possível carregar",
  mensagem,
  onTentarNovamente,
}: ErrorStateProps) {
  return (
    <div className="estado estado--erro" role="alert" data-cy="estado-erro">
      <span className="estado__icone" aria-hidden="true">
        <AlertTriangle size={22} strokeWidth={1.75} />
      </span>
      <p className="estado__titulo">{titulo}</p>
      {mensagem && <p className="estado__texto">{mensagem}</p>}
      {onTentarNovamente && (
        <div className="estado__acoes">
          <Button
            variante="secundario"
            icone={<RotateCw size={16} strokeWidth={1.75} aria-hidden="true" />}
            onClick={onTentarNovamente}
            data-cy="tentar-novamente"
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- Carregando */
interface CarregandoProps {
  ativo: boolean;
  /** Mensagem mostrada após 2 s, ex.: "Carregando agenda...". */
  contexto: string;
  /** Skeleton com as dimensões do conteúdo final (mostrado após 300 ms). */
  skeleton?: React.ReactNode;
  onTentarNovamente?: () => void;
}

/**
 * Aplica a regra de tempo: nada < 300 ms; skeleton/spinner até 2 s;
 * mensagem de contexto até 10 s; depois aviso de lentidão com "Tentar novamente".
 * A região é aria-live="polite" para leitores de tela.
 */
export function Carregando({ ativo, contexto, skeleton, onTentarNovamente }: CarregandoProps) {
  const fase = useAtrasoLoading(ativo);

  return (
    <div aria-live="polite" aria-busy={ativo || undefined} data-cy="carregando" data-fase={fase}>
      {fase !== "oculto" && skeleton}
      {fase !== "oculto" && !skeleton && (
        <div className="carregando">
          <Spinner rotulo="" />
        </div>
      )}
      {fase === "mensagem" && (
        <p className="carregando" data-cy="carregando-mensagem">
          {contexto}
        </p>
      )}
      {fase === "lento" && (
        <div className="carregando carregando--lento" data-cy="carregando-lento">
          <p style={{ margin: 0 }}>Está demorando mais que o normal. {contexto}</p>
          {onTentarNovamente && (
            <Button variante="secundario" onClick={onTentarNovamente} data-cy="tentar-novamente">
              Tentar novamente
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
