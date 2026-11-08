// @requisito RO-37 RE-13
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Modal } from "@/components/ds";
import { obterLojaAtiva } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";
import { linkWhatsApp, mensagemConfirmacao } from "@/lib/whatsapp";
import { ROTULO_STATUS } from "@/lib/statusAgendamento";
import { agendamentosService, type AgendamentoAgenda } from "@/services/endpoints";

const tomDoStatus = (s?: string) =>
  s === "CONFIRMADO" || s === "CONCLUIDO"
    ? "marca"
    : s === "CANCELADO" || s === "NAO_COMPARECEU"
      ? "erro"
      : "aviso";

interface Props {
  agendamento: AgendamentoAgenda | null;
  onFechar: () => void;
  /** Depois de mudar o status (a agenda recarrega). */
  onAlterado: () => void;
}

/**
 * Detalhes de um agendamento da agenda. Fase 0 do WhatsApp: "Enviar confirmação" abre o
 * WhatsApp da loja com a mensagem pronta; quando o cliente responder, a recepção marca
 * "Confirmado" aqui.
 */
export default function DetalheAgendamentoModal({ agendamento, onFechar, onAlterado }: Props) {
  const [salvando, setSalvando] = useState<string | null>(null);
  const podeEditar = temPermissao("AGENDAMENTO_EDITAR");
  const a = agendamento;
  const status = a?.status ?? "AGENDADO";

  const link = a
    ? linkWhatsApp(
        a.celularCliente,
        mensagemConfirmacao({
          cliente: a.cliente,
          servico: a.servico,
          profissional: a.profissional,
          data: a.data,
          horaInicio: a.horaInicio,
          nomeLoja: a.nomeLoja || obterLojaAtiva()?.nomeLoja,
        }),
      )
    : null;

  const alterar = async (novo: string, mensagem: string) => {
    if (!a) return;
    setSalvando(novo);
    try {
      await agendamentosService.alterarStatus(a.id, novo);
      toast.success(mensagem);
      onAlterado();
      onFechar();
    } catch {
      // toast pelo interceptor do axios
    } finally {
      setSalvando(null);
    }
  };

  return (
    <Modal
      titulo={a ? `${a.cliente || "Cliente"} · ${a.horaInicio}–${a.horaFim}` : "Agendamento"}
      aberto={!!a}
      onFechar={onFechar}
      data-cy="modal-detalhe-agendamento"
      rodape={
        <Button variante="secundario" onClick={onFechar}>
          Fechar
        </Button>
      }
    >
      {a && (
        <div className="detalhe-agendamento">
          <p>
            <Badge tom={tomDoStatus(status)}>
              <span data-cy="detalhe-status">{ROTULO_STATUS[status] ?? status}</span>
            </Badge>
          </p>
          <dl className="detalhe-agendamento__dados">
            <dt>Data</dt>
            <dd>{a.data}</dd>
            <dt>Serviço</dt>
            <dd>{a.servico || "—"}</dd>
            <dt>Profissional</dt>
            <dd>{a.profissional || "—"}</dd>
            <dt>Celular</dt>
            <dd>{a.celularCliente || "Não cadastrado"}</dd>
          </dl>

          <div className="detalhe-agendamento__acoes">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primario"
                data-cy="enviar-whatsapp"
              >
                <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
                Enviar confirmação pelo WhatsApp
              </a>
            ) : (
              <p className="texto-ajuda" data-cy="sem-celular">
                Cadastre um celular válido (com DDD) no cliente para enviar a confirmação pelo
                WhatsApp.
              </p>
            )}
            {podeEditar && status !== "CONFIRMADO" && status !== "CANCELADO" && (
              <Button
                variante="secundario"
                disabled={salvando !== null}
                onClick={() => alterar("CONFIRMADO", "Horário marcado como confirmado.")}
                data-cy="marcar-confirmado"
              >
                {salvando === "CONFIRMADO" ? "Salvando..." : "Cliente confirmou"}
              </Button>
            )}
            {podeEditar && status !== "CANCELADO" && (
              <Button
                variante="perigo"
                disabled={salvando !== null}
                onClick={() => {
                  if (
                    window.confirm(
                      "Cancelar este horário? Ele continua na agenda, marcado como cancelado.",
                    )
                  ) {
                    alterar("CANCELADO", "Horário cancelado.");
                  }
                }}
                data-cy="marcar-cancelado"
              >
                {salvando === "CANCELADO" ? "Salvando..." : "Cancelar horário"}
              </Button>
            )}
            {podeEditar && status === "CANCELADO" && (
              <Button
                variante="secundario"
                disabled={salvando !== null}
                onClick={() => alterar("AGENDADO", "Horário reativado.")}
                data-cy="reativar"
              >
                Reativar horário
              </Button>
            )}
          </div>
          <p className="texto-ajuda">
            O WhatsApp abre no número em que você está logado (o da loja). Quando o cliente
            responder, clique em “Cliente confirmou”.
          </p>
        </div>
      )}
    </Modal>
  );
}
