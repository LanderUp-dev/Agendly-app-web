// @requisito RU-01
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Modal } from "@/components/ds";
import type { AgendamentoAgenda } from "@/services/endpoints";
import { mensagemDoErro, moverAgendamento, type DestinoMover } from "./moverAgendamento";

export interface PedidoMover {
  agendamento: AgendamentoAgenda;
  profissional: string;
  destino: DestinoMover;
}

interface Props {
  pedido: PedidoMover | null;
  onFechar: () => void;
  /** Depois de mover (a agenda recarrega). */
  onMovido: () => void;
}

/**
 * Confirmação do arrastar e soltar: "Mover para 14:30 com Ana?". Nada muda na grade antes
 * do backend aceitar; se ele recusar (conflito, fora do expediente), a mensagem aparece aqui
 * e o bloco continua onde estava.
 */
export default function MoverAgendamentoModal({ pedido, onFechar, onMovido }: Props) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setErro(null);
    setSalvando(false);
  }, [pedido]);

  const a = pedido?.agendamento;
  const mesmoProfissional = pedido && a && pedido.destino.idFuncionario === a.idFuncionario;
  const mesmaData = pedido && a && pedido.destino.data.split("-").reverse().join("/") === a.data;

  const confirmar = async () => {
    if (!pedido) return;
    setSalvando(true);
    setErro(null);
    try {
      await moverAgendamento(pedido.agendamento, pedido.destino);
      toast.success(`Agendamento movido para ${pedido.destino.hora} com ${pedido.profissional}.`);
      onMovido();
      onFechar();
    } catch (err) {
      setErro(mensagemDoErro(err));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      titulo="Mover agendamento"
      aberto={!!pedido}
      onFechar={onFechar}
      data-cy="modal-mover-agendamento"
      rodape={
        <>
          <Button variante="secundario" onClick={onFechar} data-cy="mover-cancelar">
            {erro ? "Fechar" : "Cancelar"}
          </Button>
          <Button onClick={confirmar} disabled={salvando} data-cy="mover-confirmar">
            {salvando ? "Movendo..." : "Mover"}
          </Button>
        </>
      }
    >
      {pedido && a && (
        <div className="detalhe-agendamento">
          <p data-cy="mover-pergunta">
            <strong>
              Mover para {pedido.destino.hora} com {pedido.profissional}?
            </strong>
          </p>
          <p className="texto-ajuda">
            {a.cliente || "Cliente"} · {a.servico || "Serviço"}. Hoje está às {a.horaInicio}
            {mesmoProfissional ? "" : ` com ${a.profissional}`}
            {mesmaData ? "" : ` em ${a.data}`}. A duração continua a mesma.
          </p>
          {erro && (
            <p className="campo-erro" role="alert" data-cy="mover-erro">
              {erro}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
