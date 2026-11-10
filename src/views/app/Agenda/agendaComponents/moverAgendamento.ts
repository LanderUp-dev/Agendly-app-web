// @requisito RU-01
import { extrairMensagemErro } from "@/config/axios";
import { agendamentosService, type AgendamentoAgenda } from "@/services/endpoints";
import { horaEmMinutos, novoFim } from "./arrastarAgenda";

export interface DestinoMover {
  /** yyyy-MM-dd */
  data: string;
  /** HH:mm */
  hora: string;
  idFuncionario: number;
}

/**
 * Move um agendamento (data, horário e/ou profissional) pelo PUT /agendamentos/{id}.
 * O PUT troca o registro inteiro: busca o atual e reenvia tudo (cliente, serviço, status,
 * cor), mudando só data, início, fim (mesma duração) e profissional.
 * O backend confere expediente e conflito; erro 400 vem como texto.
 */
export async function moverAgendamento(ag: AgendamentoAgenda, destino: DestinoMover) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atual: any = await agendamentosService.buscar(ag.id).catch(() => null);
  const base = atual && atual.id != null ? atual : null;

  const inicioAtual = String(base?.horarioInicio ?? ag.horaInicio).slice(0, 5);
  const fimAtual = String(base?.horarioFim ?? ag.horaFim).slice(0, 5);
  const fim = novoFim(inicioAtual, fimAtual, destino.hora);
  if (!fim) {
    throw new Error("O atendimento passaria da meia-noite. Escolha um horário mais cedo.");
  }

  return agendamentosService.atualizar(ag.id, {
    ...(base ?? {}),
    id: ag.id,
    data: destino.data,
    horarioInicio: `${destino.hora}:00`,
    horarioFim: `${fim}:00`,
    duracao: horaEmMinutos(fim) - horaEmMinutos(destino.hora),
    status: base?.status ?? ag.status ?? "AGENDADO",
    cor: base?.cor ?? undefined,
    idCliente: base?.idCliente ?? ag.idCliente,
    idServico: base?.idServico ?? ag.idServico,
    idFuncionario: destino.idFuncionario,
  });
}

/** Texto para mostrar ao usuário a partir do erro do axios (ou do nosso). */
export function mensagemDoErro(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any;
  return (
    extrairMensagemErro(e?.response?.data) ??
    (e?.isAxiosError ? null : e?.message) ??
    "Não foi possível mover o agendamento. Tente de novo."
  );
}
