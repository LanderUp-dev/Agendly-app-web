// @requisito RNR-23
import React from "react";
import { Link } from "@tanstack/react-router";
import type { SituacaoLimite } from "@/hooks/useLimiteProfissionais";

const qtd = (n: number) => (n === 1 ? "1 profissional" : `${n} profissionais`);

/** Texto de quem limita: "o plano Solo" ou "o teste grátis". */
function origem(s: SituacaoLimite) {
  return s.tipoAcesso === "TESTE" ? "o teste grátis" : `o plano ${s.plano ?? "atual"}`;
}

/**
 * Aviso do limite de profissionais do plano. Não aparece quando é ilimitado.
 * Cheio: alerta com o caminho para trocar de plano. Com vaga: só uma linha informando.
 */
export function AvisoLimiteProfissionais({ situacao }: { situacao: SituacaoLimite | null }) {
  if (!situacao || situacao.limite == null) return null;
  const { limite, cadastrados } = situacao;
  if (!situacao.podeCadastrar) {
    return (
      <div className="alerta alerta-aviso alerta-com-acao" role="status" data-cy="limite-cheio">
        <span>
          Você chegou ao limite: {origem(situacao)} permite até {qtd(limite)} ({cadastrados}{" "}
          cadastrado{cadastrados === 1 ? "" : "s"}). Quem já está cadastrado continua na agenda.
        </span>
        <Link to="/plano" className="btn btn-secundario">
          Ver planos
        </Link>
      </div>
    );
  }
  const restam = limite - cadastrados;
  return (
    <p className="texto-ajuda" data-cy="limite-vagas">
      {origem(situacao).replace(/^o /, "O ")} permite até {qtd(limite)}: {cadastrados} cadastrado
      {cadastrados === 1 ? "" : "s"}, {restam === 1 ? "falta 1" : `faltam ${restam}`}.
    </p>
  );
}
