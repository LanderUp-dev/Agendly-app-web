// @requisito RE-07 RO-12 RO-13 RO-14 RR-17 RR-21 RO-15
/* eslint-disable @typescript-eslint/no-explicit-any -- serviços e funcionários vêm sem tipo do backend */
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Button, Modal } from "@/components/ds";
import { temPermissao } from "@/lib/permissoes";
import { lerValor, paraCampo, reais, somar } from "@/lib/dinheiro";
import { funcionariosService, servicosService, type AgendamentoAgenda } from "@/services/endpoints";
import PendenciaCliente from "@/views/app/Recebimento/PendenciaCliente";
import {
  caixaService,
  comandaService,
  FORMAS_PAGAMENTO,
  type Caixa,
  type FormaPagamento,
} from "@/services/financeiro";

interface Props {
  /** Agendamento de origem (null = modal fechado). */
  agendamento: AgendamentoAgenda | null;
  onFechar: () => void;
  /** Depois de salvar (a agenda recarrega). */
  onFechado: () => void;
}

interface LinhaItem {
  chave: number;
  idServico: string;
  idFuncionario: string;
  valor: string;
}

interface LinhaPagamento {
  chave: number;
  forma: FormaPagamento;
  valor: string;
}

let proximaChave = 1;
const novaChave = () => proximaChave++;

const nome = (p: any) => [p?.nome, p?.sobrenome].filter(Boolean).join(" ");

/**
 * Fecha o atendimento: serviços feitos (já vem o do agendamento), desconto/acréscimo e as
 * formas de pagamento. O que passar do total em dinheiro vira troco. Precisa de caixa aberto.
 */
export default function ComandaModal({ agendamento, onFechar, onFechado }: Props) {
  const aberto = !!agendamento;
  const [caixa, setCaixa] = useState<Caixa | null | undefined>(undefined);
  const [servicos, setServicos] = useState<any[]>([]);
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [itens, setItens] = useState<LinhaItem[]>([]);
  const [pagamentos, setPagamentos] = useState<LinhaPagamento[]>([]);
  const [desconto, setDesconto] = useState("");
  const [acrescimo, setAcrescimo] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Ao abrir: confere o caixa e carrega serviços/profissionais; já preenche com o agendamento.
  useEffect(() => {
    if (!agendamento) return;
    setErro("");
    setDesconto("");
    setAcrescimo("");
    setCaixa(undefined);
    let ativo = true;
    Promise.all([caixaService.atual(), servicosService.listar(), funcionariosService.listar()])
      .then(([c, s, f]) => {
        if (!ativo) return;
        setCaixa(c);
        setServicos(s);
        setFuncionarios(f);
        const servico = s.find((x: any) => x.id === agendamento.idServico);
        const valor = servico?.preco != null ? paraCampo(Number(servico.preco)) : "";
        setItens([
          {
            chave: novaChave(),
            idServico: agendamento.idServico ? String(agendamento.idServico) : "",
            idFuncionario: agendamento.idFuncionario ? String(agendamento.idFuncionario) : "",
            valor,
          },
        ]);
        setPagamentos([{ chave: novaChave(), forma: "PIX", valor }]);
      })
      .catch(() => {
        if (ativo) setCaixa(null);
      });
    return () => {
      ativo = false;
    };
  }, [agendamento]);

  const subtotal = somar(itens.map((i) => lerValor(i.valor) ?? 0));
  const total = Math.max(
    0,
    somar([subtotal, lerValor(acrescimo) ?? 0, -(lerValor(desconto) ?? 0)]),
  );
  const pago = somar(pagamentos.map((p) => lerValor(p.valor) ?? 0));
  const falta = somar([total, -pago]);
  const dinheiro = somar(
    pagamentos.filter((p) => p.forma === "DINHEIRO").map((p) => lerValor(p.valor) ?? 0),
  );

  const situacao = useMemo(() => {
    if (falta > 0) return { tipo: "falta" as const, texto: `Falta receber ${reais(falta)}` };
    if (falta < 0) return { tipo: "troco" as const, texto: `Troco: ${reais(-falta)}` };
    return { tipo: "ok" as const, texto: "Valor recebido confere com o total" };
  }, [falta]);

  const mudarItem = (chave: number, campo: keyof LinhaItem, valor: string) =>
    setItens((lista) =>
      lista.map((i) => {
        if (i.chave !== chave) return i;
        const novo = { ...i, [campo]: valor };
        if (campo === "idServico") {
          const s = servicos.find((x) => String(x.id) === valor);
          novo.valor = s?.preco != null ? paraCampo(Number(s.preco)) : "";
        }
        return novo;
      }),
    );

  const mudarPagamento = (chave: number, campo: "forma" | "valor", valor: string) =>
    setPagamentos((lista) => lista.map((p) => (p.chave === chave ? { ...p, [campo]: valor } : p)));

  /** Coloca o que falta (ou ajusta para baixo) na linha de pagamento. */
  const completar = (chave: number) =>
    setPagamentos((lista) => {
      const outros = somar(
        lista.filter((p) => p.chave !== chave).map((p) => lerValor(p.valor) ?? 0),
      );
      const restante = Math.max(0, somar([total, -outros]));
      return lista.map((p) => (p.chave === chave ? { ...p, valor: paraCampo(restante) } : p));
    });

  const salvar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agendamento) return;
    if (itens.some((i) => !i.idServico || !i.idFuncionario)) {
      setErro("Escolha o serviço e o profissional de cada linha.");
      return;
    }
    if (itens.some((i) => lerValor(i.valor) === null || (lerValor(i.valor) ?? 0) < 0)) {
      setErro("Informe o valor de cada serviço.");
      return;
    }
    if (falta > 0) {
      setErro(`Falta receber ${reais(falta)}.`);
      return;
    }
    if (falta < 0 && -falta > dinheiro) {
      setErro("Pagamento maior que o total só em dinheiro (com troco).");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      await comandaService.fechar({
        idAgendamento: agendamento.id,
        itens: itens.map((i) => ({
          idServico: Number(i.idServico),
          idFuncionario: Number(i.idFuncionario),
          valor: lerValor(i.valor) ?? 0,
        })),
        desconto: lerValor(desconto) ?? 0,
        acrescimo: lerValor(acrescimo) ?? 0,
        pagamentos: pagamentos
          .map((p) => ({ forma: p.forma, valor: lerValor(p.valor) ?? 0 }))
          .filter((p) => p.valor > 0),
      });
      toast.success(
        falta < 0 ? `Atendimento fechado. Troco: ${reais(-falta)}.` : "Atendimento fechado.",
      );
      onFechado();
      onFechar();
    } catch (err) {
      const dados = isAxiosError(err) ? err.response?.data : undefined;
      if (typeof dados === "string" && dados.length < 200) setErro(dados);
    } finally {
      setSalvando(false);
    }
  };

  const podeGerenciarCaixa = temPermissao("CAIXA_GERENCIAR");

  return (
    <Modal
      titulo={
        agendamento
          ? `Fechar atendimento · ${agendamento.cliente || "Cliente"}`
          : "Fechar atendimento"
      }
      aberto={aberto}
      onFechar={onFechar}
      data-cy="modal-comanda"
      rodape={
        <>
          <Button variante="secundario" onClick={onFechar}>
            Voltar
          </Button>
          {caixa && (
            <Button
              type="submit"
              form="form-comanda"
              carregando={salvando}
              textoCarregando="Salvando..."
              data-cy="comanda-salvar"
            >
              Receber {reais(total)}
            </Button>
          )}
        </>
      }
    >
      {caixa === undefined && <p className="texto-ajuda">Carregando...</p>}
      {caixa === null && (
        <div className="alerta alerta-aviso" role="alert" data-cy="comanda-sem-caixa">
          Não há caixa aberto.{" "}
          {podeGerenciarCaixa ? (
            <Link to="/caixa" className="link">
              Abrir o caixa
            </Link>
          ) : (
            "Peça ao gerente para abrir o caixa."
          )}
        </div>
      )}
      {caixa && (
        <form id="form-comanda" className="comanda" onSubmit={salvar} noValidate>
          {erro && (
            <div className="alerta alerta-erro" role="alert" data-cy="comanda-erro">
              {erro}
            </div>
          )}

          {agendamento?.idCliente && <PendenciaCliente idCliente={agendamento.idCliente} />}

          <fieldset className="comanda__grupo">
            <legend>Serviços</legend>
            {itens.map((i, n) => (
              <div key={i.chave} className="comanda__linha" data-cy={`comanda-item-${n}`}>
                <select
                  className="campo"
                  aria-label={`Serviço ${n + 1}`}
                  value={i.idServico}
                  onChange={(e) => mudarItem(i.chave, "idServico", e.target.value)}
                  data-cy="comanda-servico"
                >
                  <option value="">Serviço...</option>
                  {servicos.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
                <select
                  className="campo"
                  aria-label={`Profissional do serviço ${n + 1}`}
                  value={i.idFuncionario}
                  onChange={(e) => mudarItem(i.chave, "idFuncionario", e.target.value)}
                  data-cy="comanda-profissional"
                >
                  <option value="">Profissional...</option>
                  {funcionarios.map((f) => (
                    <option key={f.id} value={f.id}>
                      {nome(f)}
                    </option>
                  ))}
                </select>
                <input
                  className="campo comanda__valor"
                  inputMode="decimal"
                  aria-label={`Valor do serviço ${n + 1}`}
                  value={i.valor}
                  onChange={(e) => mudarItem(i.chave, "valor", e.target.value)}
                  data-cy="comanda-valor"
                />
                {itens.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-fantasma btn-icone"
                    aria-label={`Remover serviço ${n + 1}`}
                    onClick={() => setItens((l) => l.filter((x) => x.chave !== i.chave))}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="link comanda__adicionar"
              onClick={() =>
                setItens((l) => [
                  ...l,
                  {
                    chave: novaChave(),
                    idServico: "",
                    idFuncionario: l[0]?.idFuncionario ?? "",
                    valor: "",
                  },
                ])
              }
              data-cy="comanda-adicionar-servico"
            >
              <Plus size={14} aria-hidden="true" /> Adicionar serviço
            </button>
          </fieldset>

          <div className="comanda__ajustes">
            <label className="campo-wrapper">
              <span className="campo-label">Desconto (R$)</span>
              <input
                inputMode="decimal"
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
                placeholder="0,00"
                data-cy="comanda-desconto"
              />
            </label>
            <label className="campo-wrapper">
              <span className="campo-label">Acréscimo (R$)</span>
              <input
                inputMode="decimal"
                value={acrescimo}
                onChange={(e) => setAcrescimo(e.target.value)}
                placeholder="0,00"
                data-cy="comanda-acrescimo"
              />
            </label>
          </div>

          <p className="comanda__total">
            Total <strong data-cy="comanda-total">{reais(total)}</strong>
          </p>

          <fieldset className="comanda__grupo">
            <legend>Pagamento</legend>
            {pagamentos.map((p, n) => (
              <div key={p.chave} className="comanda__linha" data-cy={`comanda-pagamento-${n}`}>
                <select
                  className="campo"
                  aria-label={`Forma de pagamento ${n + 1}`}
                  value={p.forma}
                  onChange={(e) => mudarPagamento(p.chave, "forma", e.target.value)}
                  data-cy="comanda-forma"
                >
                  {FORMAS_PAGAMENTO.map((f) => (
                    <option key={f.forma} value={f.forma}>
                      {f.descricao}
                    </option>
                  ))}
                </select>
                <input
                  className="campo comanda__valor"
                  inputMode="decimal"
                  aria-label={`Valor pago na forma ${n + 1}`}
                  value={p.valor}
                  onChange={(e) => mudarPagamento(p.chave, "valor", e.target.value)}
                  data-cy="comanda-pago"
                />
                <button
                  type="button"
                  className="link"
                  onClick={() => completar(p.chave)}
                  data-cy="comanda-completar"
                >
                  Restante
                </button>
                {pagamentos.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-fantasma btn-icone"
                    aria-label={`Remover pagamento ${n + 1}`}
                    onClick={() => setPagamentos((l) => l.filter((x) => x.chave !== p.chave))}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="link comanda__adicionar"
              onClick={() =>
                setPagamentos((l) => [...l, { chave: novaChave(), forma: "DINHEIRO", valor: "" }])
              }
              data-cy="comanda-adicionar-pagamento"
            >
              <Plus size={14} aria-hidden="true" /> Dividir em outra forma
            </button>
          </fieldset>

          <p
            className={`comanda__situacao comanda__situacao--${situacao.tipo}`}
            aria-live="polite"
            data-cy="comanda-situacao"
          >
            {situacao.texto}
          </p>
        </form>
      )}
    </Modal>
  );
}
