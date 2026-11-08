// @requisito RO-15
import { useEffect, useState } from "react";
import { recebimentosService, type PendenciasCliente } from "@/services/recebimentos";
import { temPermissao } from "@/lib/permissoes";
import { textoPendencia } from "./recebimentoUtil";

interface PendenciaClienteProps {
  /** Cliente escolhido; sem cliente, nada aparece. */
  idCliente?: number | string | null;
}

/**
 * Aviso de que o cliente tem contas a receber em aberto (RO-15). Reutilizável:
 * formulário de recebimento e, depois, o modal de fechar atendimento da agenda.
 * Não mostra nada se o usuário não pode ver recebimentos ou se der erro.
 */
export function PendenciaCliente({ idCliente }: PendenciaClienteProps) {
  const [pendencias, setPendencias] = useState<PendenciasCliente | null>(null);
  const id = idCliente ? Number(idCliente) : null;
  const podeVer = temPermissao("RECEBIMENTO_VER");

  useEffect(() => {
    setPendencias(null);
    if (!id || !podeVer) return;
    let ativo = true;
    recebimentosService
      .pendencias(id)
      .then((p) => {
        if (ativo) setPendencias(p);
      })
      .catch(() => {
        // aviso opcional: sem pendência visível em caso de erro
      });
    return () => {
      ativo = false;
    };
  }, [id, podeVer]);

  const texto = textoPendencia(pendencias);
  if (!texto) return null;
  return (
    <div className="alerta alerta-aviso" role="status" data-cy="pendencia-cliente">
      {texto}
    </div>
  );
}

export default PendenciaCliente;
