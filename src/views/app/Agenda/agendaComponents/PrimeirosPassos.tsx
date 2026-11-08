import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { ETAPAS, type EtapaChave } from "@/lib/fluxoCadastro";
import "./PrimeirosPassos.css";

const CHAVE_OCULTO = "agendly_primeiros_passos_oculto";

function lerOculto(): boolean {
  try {
    return window.localStorage.getItem(CHAVE_OCULTO) === "1";
  } catch {
    return false;
  }
}

/**
 * Guia da configuração inicial: loja → área → funcionário → serviço → cliente.
 * Cada passo fica marcado quando já existe ao menos um registro. Some quando
 * tudo está feito, ou quando o usuário oculta. Se alguma lista falhar, não aparece.
 */
export default function PrimeirosPassos() {
  const [feitos, setFeitos] = useState<Record<EtapaChave, boolean> | null>(null);
  const [oculto, setOculto] = useState(lerOculto);

  useEffect(() => {
    if (oculto) return;
    let ativo = true;
    Promise.all(
      ETAPAS.map((e) =>
        e.listar().then((itens) => [e.chave, Array.isArray(itens) && itens.length > 0] as const),
      ),
    )
      .then((pares) => ativo && setFeitos(Object.fromEntries(pares) as Record<EtapaChave, boolean>))
      .catch(() => ativo && setFeitos(null));
    return () => {
      ativo = false;
    };
  }, [oculto]);

  if (oculto || !feitos) return null;
  const total = ETAPAS.length;
  const concluidos = ETAPAS.filter((e) => feitos[e.chave]).length;
  if (concluidos === total) return null;
  const proxima = ETAPAS.find((e) => !feitos[e.chave]);

  const ocultar = () => {
    try {
      window.localStorage.setItem(CHAVE_OCULTO, "1");
    } catch {
      // Sem armazenamento: oculta só nesta visita.
    }
    setOculto(true);
  };

  return (
    <section
      className="primeiros-passos"
      aria-labelledby="primeiros-passos-titulo"
      data-cy="primeiros-passos"
    >
      <div className="primeiros-passos__topo">
        <div>
          <h2 id="primeiros-passos-titulo" className="primeiros-passos__titulo">
            Primeiros passos
          </h2>
          <p className="primeiros-passos__progresso">
            {concluidos} de {total} feitos. A ordem importa: cada passo usa o anterior.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-fantasma btn-icone"
          onClick={ocultar}
          aria-label="Ocultar primeiros passos"
        >
          <X size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <ol className="primeiros-passos__lista">
        {ETAPAS.map((etapa, i) => {
          const feito = feitos[etapa.chave];
          const atual = etapa === proxima;
          return (
            <li
              key={etapa.chave}
              className={`primeiros-passos__item${feito ? " is-feito" : ""}${atual ? " is-atual" : ""}`}
              aria-current={atual ? "step" : undefined}
            >
              <span className="primeiros-passos__marca" aria-hidden="true">
                {feito ? <Check size={14} strokeWidth={2.25} /> : i + 1}
              </span>
              <span className="primeiros-passos__texto">
                {atual ? (
                  <Link to={etapa.cadastro} className="link" data-cy={`passo-${etapa.chave}`}>
                    {etapa.titulo}
                  </Link>
                ) : (
                  <span>{etapa.titulo}</span>
                )}
                {feito && <span className="sr-only"> (feito)</span>}
                {atual && <span className="primeiros-passos__motivo">{etapa.motivo}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
