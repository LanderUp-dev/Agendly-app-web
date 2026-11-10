// @requisito RO-37 RE-13 RO-12 RU-01
import { useEffect, useState } from "react";
import { MessageCircle, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, FormField, Modal } from "@/components/ds";
import { obterLojaAtiva } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";
import { linkWhatsApp, mensagemConfirmacao } from "@/lib/whatsapp";
import { ROTULO_STATUS } from "@/lib/statusAgendamento";
import { agendamentosService, type AgendamentoAgenda } from "@/services/endpoints";
import { brParaIso, ehPassado, mudouDestino, podeMover } from "./arrastarAgenda";
import { mensagemDoErro, moverAgendamento } from "./moverAgendamento";

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
  /** Abre a comanda para receber o pagamento (módulo financeiro). */
  onFecharAtendimento?: (a: AgendamentoAgenda) => void;
  /** Profissionais da loja, para mudar o agendamento de coluna sem arrastar. */
  profissionais?: { id: number; nome: string }[];
}

/**
 * Detalhes de um agendamento da agenda. Fase 0 do WhatsApp: "Enviar confirmação" abre o
 * WhatsApp da loja com a mensagem pronta; quando o cliente responder, a recepção marca
 * "Confirmado" aqui.
 */
export default function DetalheAgendamentoModal({
  agendamento,
  onFechar,
  onAlterado,
  onFecharAtendimento,
  profissionais = [],
}: Props) {
  const [salvando, setSalvando] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ data: "", hora: "", idFuncionario: "" });
  const [erroMover, setErroMover] = useState<string | null>(null);
  const podeEditar = temPermissao("AGENDAMENTO_EDITAR");
  const podeCobrar = temPermissao("COMANDA_EDITAR") && !!onFecharAtendimento;
  const a = agendamento;
  const status = a?.status ?? "AGENDADO";
  const podeRemarcar = podeEditar && podeMover(status);

  // Outro agendamento aberto: fecha o formulário de remarcar.
  useEffect(() => {
    setEditando(false);
    setErroMover(null);
    if (agendamento) {
      setForm({
        data: brParaIso(agendamento.data),
        hora: agendamento.horaInicio,
        idFuncionario: agendamento.idFuncionario != null ? String(agendamento.idFuncionario) : "",
      });
    }
  }, [agendamento]);

  /** Caminho por teclado do arrastar e soltar (RU-01): data, horário e profissional. */
  const remarcar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!a) return;
    if (!form.data || !form.hora || !form.idFuncionario) {
      setErroMover("Preencha data, horário e profissional.");
      return;
    }
    const destino = { data: form.data, hora: form.hora, idFuncionario: Number(form.idFuncionario) };
    const origem = { data: brParaIso(a.data), hora: a.horaInicio, idFuncionario: a.idFuncionario };
    if (!mudouDestino(origem, destino)) {
      setErroMover("Nada mudou: escolha outra data, horário ou profissional.");
      return;
    }
    if (ehPassado(destino.data, destino.hora)) {
      setErroMover("Esse horário já passou. Escolha um horário futuro.");
      return;
    }
    setSalvando("MOVER");
    setErroMover(null);
    try {
      await moverAgendamento(a, destino);
      toast.success("Agendamento remarcado.");
      onAlterado();
      onFechar();
    } catch (err) {
      setErroMover(mensagemDoErro(err));
    } finally {
      setSalvando(null);
    }
  };

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

          {podeRemarcar && !editando && (
            <div className="detalhe-agendamento__acoes">
              <Button
                variante="secundario"
                onClick={() => setEditando(true)}
                data-cy="remarcar-abrir"
              >
                Mudar data, horário ou profissional
              </Button>
            </div>
          )}
          {podeRemarcar && editando && (
            <form className="form-grade" onSubmit={remarcar} noValidate data-cy="form-remarcar">
              <FormField id="remarcar-data" label="Data" obrigatorio colunas={6}>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                  data-cy="remarcar-data"
                />
              </FormField>
              <FormField
                id="remarcar-hora"
                label="Horário de início"
                obrigatorio
                colunas={6}
                ajuda="A duração continua a mesma."
              >
                <input
                  type="time"
                  step={300}
                  value={form.hora}
                  onChange={(e) => setForm((f) => ({ ...f, hora: e.target.value }))}
                  data-cy="remarcar-hora"
                />
              </FormField>
              <FormField id="remarcar-profissional" label="Profissional" obrigatorio>
                <select
                  value={form.idFuncionario}
                  onChange={(e) => setForm((f) => ({ ...f, idFuncionario: e.target.value }))}
                  data-cy="remarcar-profissional"
                >
                  <option value="">Escolha</option>
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </FormField>
              {erroMover && (
                <p
                  className="campo-erro"
                  style={{ gridColumn: "1 / -1" }}
                  role="alert"
                  data-cy="remarcar-erro"
                >
                  {erroMover}
                </p>
              )}
              <div className="detalhe-agendamento__acoes" style={{ gridColumn: "1 / -1" }}>
                <Button type="submit" disabled={salvando !== null} data-cy="remarcar-salvar">
                  {salvando === "MOVER" ? "Salvando..." : "Salvar novo horário"}
                </Button>
                <Button
                  variante="secundario"
                  onClick={() => {
                    setEditando(false);
                    setErroMover(null);
                  }}
                >
                  Desistir
                </Button>
              </div>
            </form>
          )}

          <div className="detalhe-agendamento__acoes">
            {podeCobrar &&
              status !== "CANCELADO" &&
              status !== "CONCLUIDO" &&
              status !== "NAO_COMPARECEU" && (
                <Button onClick={() => onFecharAtendimento?.(a)} data-cy="fechar-atendimento">
                  <Receipt size={18} strokeWidth={1.75} aria-hidden="true" />
                  Fechar atendimento e receber
                </Button>
              )}
            {status === "CONCLUIDO" && (
              <p className="texto-ajuda" data-cy="atendimento-pago">
                Atendimento fechado e pago. Para desfazer, cancele a comanda na tela do Caixa.
              </p>
            )}
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
