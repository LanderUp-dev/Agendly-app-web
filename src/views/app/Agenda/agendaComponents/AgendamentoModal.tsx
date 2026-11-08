// @requisito RE-13 RO-31 RO-39 RND-06
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, FormField, Modal, SelectCarregado } from "@/components/ds";
import api from "@/config/axios";
import { useCarregar } from "@/hooks/useCarregar";
import {
  agendamentosService,
  clientesService,
  funcionariosService,
  servicosService,
} from "@/services/endpoints";

/**
 * Novo agendamento (motor de horários): o horário sai de GET /disponibilidade, que já
 * considera o expediente da loja, a duração do serviço e a agenda do profissional.
 * O backend confere de novo ao salvar (conflito, expediente) e calcula o horário de fim.
 */

const isoDoDia = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

interface Disponibilidade {
  duracaoMinutos: number;
  horarioConfigurado: boolean;
  lojaAberta: boolean;
  profissionais: { idFuncionario: number; nomeFuncionario: string; horarios: string[] }[];
}

interface Pessoa {
  id: number;
  nome?: string;
  sobrenome?: string;
}

interface AgendamentoModalProps {
  aberto: boolean;
  dadosAgendamento: { profissional?: string; hora?: string };
  dataSelecionada?: Date;
  onClose: () => void;
  /** Depois de salvar (a agenda recarrega). */
  onCriado?: () => void;
}

const nomeCompleto = (p: Pessoa) => [p.nome, p.sobrenome].filter(Boolean).join(" ");

const AgendamentoModal = ({
  aberto,
  dadosAgendamento,
  dataSelecionada,
  onClose,
  onCriado,
}: AgendamentoModalProps) => {
  const clientes = useCarregar<Pessoa[]>(
    () => (aberto ? clientesService.listar() : Promise.resolve([])),
    [],
  );
  const profissionais = useCarregar<Pessoa[]>(
    () => (aberto ? funcionariosService.listar() : Promise.resolve([])),
    [],
  );
  const servicos = useCarregar<{ id: number; nome: string; duracaoMinutos?: number }[]>(
    () => (aberto ? servicosService.listar() : Promise.resolve([])),
    [],
  );

  const [form, setForm] = useState({
    cliente: "",
    profissional: "",
    servico: "",
    data: "",
    hora: "",
  });
  const [disp, setDisp] = useState<Disponibilidade | null>(null);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  // Ao abrir: data e hora clicadas; listas recarregadas.
  useEffect(() => {
    if (!aberto) return;
    setForm({
      cliente: "",
      profissional: "",
      servico: "",
      data: dataSelecionada ? isoDoDia(dataSelecionada) : "",
      hora: dadosAgendamento.hora ?? "",
    });
    setDisp(null);
    setErros({});
    clientes.recarregar();
    profissionais.recarregar();
    servicos.recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  // A agenda informa o profissional pelo nome (coluna clicada): converte para o id.
  useEffect(() => {
    if (!aberto || form.profissional || !dadosAgendamento.profissional) return;
    const p = profissionais.dados.find(
      (f) =>
        f.nome === dadosAgendamento.profissional ||
        nomeCompleto(f) === dadosAgendamento.profissional,
    );
    if (p) setForm((f) => ({ ...f, profissional: String(p.id) }));
  }, [aberto, profissionais.dados, dadosAgendamento.profissional, form.profissional]);

  // Horários livres quando serviço, profissional e data estão escolhidos.
  useEffect(() => {
    if (!aberto || !form.servico || !form.profissional || !form.data) {
      setDisp(null);
      return;
    }
    let ativo = true;
    setCarregandoHorarios(true);
    api
      .get<Disponibilidade>("/disponibilidade", {
        params: { data: form.data, servico: form.servico, funcionario: form.profissional },
      })
      .then((r) => ativo && setDisp(r.data))
      .catch(() => ativo && setDisp(null))
      .finally(() => ativo && setCarregandoHorarios(false));
    return () => {
      ativo = false;
    };
  }, [aberto, form.servico, form.profissional, form.data]);

  const horarios = useMemo(() => disp?.profissionais[0]?.horarios ?? [], [disp]);

  // Hora clicada na agenda que não está livre (ou mudou o serviço): limpa a escolha.
  useEffect(() => {
    if (disp && form.hora && !horarios.includes(form.hora)) {
      setForm((f) => ({ ...f, hora: "" }));
    }
  }, [disp, horarios, form.hora]);

  const mudar = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErros((x) => ({ ...x, [e.target.name]: "" }));
  };

  const salvar = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const novos: Record<string, string> = {};
    if (!form.cliente) novos.cliente = "Escolha o cliente.";
    if (!form.servico) novos.servico = "Escolha o serviço.";
    if (!form.profissional) novos.profissional = "Escolha o profissional.";
    if (!form.data) novos.data = "Escolha a data.";
    if (!form.hora) novos.hora = "Escolha um horário livre.";
    setErros(novos);
    if (Object.keys(novos).length) return;

    setSalvando(true);
    try {
      await agendamentosService.criar({
        data: form.data,
        horarioInicio: `${form.hora}:00`,
        idCliente: Number(form.cliente),
        idServico: Number(form.servico),
        idFuncionario: Number(form.profissional),
        status: "AGENDADO",
      });
      toast.success("Agendamento criado.");
      onCriado?.();
      onClose();
    } catch {
      // conflito / fora do expediente: mensagem do backend pelo interceptor
    } finally {
      setSalvando(false);
    }
  };

  let ajudaHora = "Escolha serviço, profissional e data para ver os horários livres.";
  if (carregandoHorarios) ajudaHora = "Buscando horários livres...";
  else if (disp && !disp.lojaAberta) ajudaHora = "A loja não abre neste dia.";
  else if (disp && horarios.length === 0) ajudaHora = "Nenhum horário livre neste dia.";
  else if (disp)
    ajudaHora = `${horarios.length} horário(s) livre(s) · duração ${disp.duracaoMinutos} min${
      disp.horarioConfigurado ? "" : " · loja sem horário configurado (08:00–20:00)"
    }`;

  return (
    <Modal
      titulo="Novo agendamento"
      aberto={aberto}
      onFechar={onClose}
      data-cy="modal-agendamento"
      rodape={
        <>
          <Button variante="secundario" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-agendamento"
            disabled={salvando}
            data-cy="salvar-agendamento"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </>
      }
    >
      <form id="form-agendamento" className="form-grade" onSubmit={salvar} noValidate>
        <SelectCarregado
          id="ag-cliente"
          name="cliente"
          label="Cliente"
          obrigatorio
          value={form.cliente}
          onChange={mudar}
          itens={clientes.dados}
          carregando={clientes.carregando}
          erroCarregamento={clientes.erro}
          onTentarNovamente={clientes.recarregar}
          valorItem={(c) => c.id}
          rotuloItem={nomeCompleto}
          nomePlural="clientes"
          vazioTexto="Nenhum cliente cadastrado."
          cadastrarEm="/cadastro-cliente"
          selecionarUnico={false}
          erro={erros.cliente}
          data-cy="ag-cliente"
        />
        <SelectCarregado
          id="ag-servico"
          name="servico"
          label="Serviço"
          obrigatorio
          colunas={6}
          value={form.servico}
          onChange={mudar}
          itens={servicos.dados}
          carregando={servicos.carregando}
          erroCarregamento={servicos.erro}
          onTentarNovamente={servicos.recarregar}
          valorItem={(s) => s.id}
          rotuloItem={(s) => `${s.nome} (${s.duracaoMinutos ?? 30} min)`}
          nomePlural="serviços"
          vazioTexto="Nenhum serviço cadastrado."
          cadastrarEm="/cadastro-servico"
          erro={erros.servico}
          data-cy="ag-servico"
        />
        <SelectCarregado
          id="ag-profissional"
          name="profissional"
          label="Profissional"
          obrigatorio
          colunas={6}
          value={form.profissional}
          onChange={mudar}
          itens={profissionais.dados}
          carregando={profissionais.carregando}
          erroCarregamento={profissionais.erro}
          onTentarNovamente={profissionais.recarregar}
          valorItem={(p) => p.id}
          rotuloItem={nomeCompleto}
          nomePlural="profissionais"
          vazioTexto="Nenhum profissional cadastrado."
          cadastrarEm="/cadastro-funcionario"
          erro={erros.profissional}
          data-cy="ag-profissional"
        />
        <FormField id="ag-data" label="Data" obrigatorio colunas={6} erro={erros.data}>
          <input type="date" name="data" value={form.data} onChange={mudar} data-cy="ag-data" />
        </FormField>
        <FormField
          id="ag-hora"
          label="Horário"
          obrigatorio
          colunas={6}
          erro={erros.hora}
          carregando={carregandoHorarios}
          ajuda={ajudaHora}
        >
          <select
            name="hora"
            value={form.hora}
            onChange={mudar}
            disabled={!disp || horarios.length === 0}
            data-cy="ag-hora"
          >
            <option value="">{disp ? "Escolha um horário" : "—"}</option>
            {horarios.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Modal>
  );
};

export default AgendamentoModal;
