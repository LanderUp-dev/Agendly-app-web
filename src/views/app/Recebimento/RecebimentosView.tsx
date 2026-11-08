// @requisito RE-09 RR-27 RR-29 RR-30 RR-31 RO-15 RO-23 RNR-15 RNR-17 RNF-02 RNF-06
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Layout } from "@/components/layout/Layout";
import {
  Badge,
  Button,
  Card,
  Carregando,
  EmptyState,
  ErrorState,
  Modal,
  PageHeader,
} from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { lerValor, paraCampo, reais } from "@/lib/dinheiro";
import { temPermissao } from "@/lib/permissoes";
import { clientesService } from "@/services/endpoints";
import {
  caixaService,
  descricaoForma,
  FORMAS_PAGAMENTO,
  type FormaPagamento,
} from "@/services/financeiro";
import {
  recebimentosService,
  type ListaRecebimentos,
  type Recebimento,
  type StatusRecebimento,
} from "@/services/recebimentos";
import { PendenciaCliente } from "./PendenciaCliente";
import { dataBR, mesAtual, periodoDoMes } from "./recebimentoUtil";
import "../Financeiro/Financeiro.css";
import "./Recebimento.css";

interface ClienteOpcao {
  id: number;
  nome: string;
  sobreNome?: string | null;
}

const nomeCliente = (c: ClienteOpcao) => `${c.nome ?? ""} ${c.sobreNome ?? ""}`.trim();
const hojeISO = () => new Date().toLocaleDateString("sv-SE");

const mensagemDaApi = (err: unknown) => {
  const dados = isAxiosError(err) ? err.response?.data : undefined;
  return typeof dados === "string" && dados.length < 300 ? dados : "";
};

const VAZIA: ListaRecebimentos = {
  de: "",
  ate: "",
  resumo: { emAberto: 0, vencido: 0, recebido: 0 },
  itens: [],
};

interface FormRecebimento {
  idCliente: string;
  nome: string;
  descricao: string;
  valor: string;
  vencimento: string;
  parcelas: string;
}

const FORM_VAZIO: FormRecebimento = {
  idCliente: "",
  nome: "",
  descricao: "",
  valor: "",
  vencimento: "",
  parcelas: "1",
};

/** Contas a receber (fiado): filtros por mês, status e cliente; criar, receber, desfazer e excluir. */
export default function RecebimentosView() {
  const podeEditar = temPermissao("RECEBIMENTO_EDITAR");
  const [mes, setMes] = useState(mesAtual());
  const [status, setStatus] = useState<"" | StatusRecebimento>("");
  const [cliente, setCliente] = useState("");

  const lista = useCarregar<ListaRecebimentos>(
    () =>
      recebimentosService.listar({
        ...periodoDoMes(mes || mesAtual()),
        status: status || undefined,
        cliente: cliente ? Number(cliente) : undefined,
      }),
    VAZIA,
  );
  const clientes = useCarregar<ClienteOpcao[]>(() => clientesService.listar(), []);

  // ---------- criar / editar ----------
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Recebimento | null>(null);
  const [form, setForm] = useState<FormRecebimento>(FORM_VAZIO);
  const [erroForm, setErroForm] = useState("");
  const [salvando, setSalvando] = useState(false);

  // ---------- receber ----------
  const [recebendo, setRecebendo] = useState<Recebimento | null>(null);
  const [forma, setForma] = useState<FormaPagamento>("DINHEIRO");
  const [dataReceb, setDataReceb] = useState("");
  const [noCaixa, setNoCaixa] = useState(false);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [erroReceber, setErroReceber] = useState("");

  const campo =
    (k: keyof FormRecebimento) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  // Recarrega ao mudar os filtros (a 1ª carga já é feita pelo useCarregar).
  const primeiraCarga = useRef(true);
  const { recarregar } = lista;
  useEffect(() => {
    if (primeiraCarga.current) {
      primeiraCarga.current = false;
      return;
    }
    recarregar();
  }, [mes, status, cliente, recarregar]);

  const novo = () => {
    setEditando(null);
    setForm({ ...FORM_VAZIO, vencimento: hojeISO() });
    setErroForm("");
    setFormAberto(true);
  };

  const editar = (r: Recebimento) => {
    setEditando(r);
    setForm({
      idCliente: String(r.idCliente),
      nome: r.nome,
      descricao: r.descricao ?? "",
      valor: paraCampo(r.valor),
      vencimento: r.vencimento,
      parcelas: "1",
    });
    setErroForm("");
    setFormAberto(true);
  };

  const salvar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const valor = lerValor(form.valor);
    const parcelas = Number(form.parcelas);
    if (!form.idCliente) return setErroForm("Escolha o cliente.");
    if (!form.nome.trim()) return setErroForm("Informe o nome.");
    if (valor === null || valor <= 0) return setErroForm("Informe um valor maior que zero.");
    if (!form.vencimento) return setErroForm("Informe o vencimento.");
    if (!editando && (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > 60)) {
      return setErroForm("O número de parcelas deve ser de 1 a 60.");
    }
    const dados = {
      idCliente: Number(form.idCliente),
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || undefined,
      valor,
      vencimento: form.vencimento,
      parcelas: editando ? undefined : parcelas,
    };
    setSalvando(true);
    setErroForm("");
    try {
      if (editando) {
        await recebimentosService.atualizar(editando.id, dados);
        toast.success("Recebimento atualizado.");
      } else {
        const criados = await recebimentosService.criar(dados);
        toast.success(
          criados.length > 1 ? `${criados.length} parcelas criadas.` : "Recebimento criado.",
        );
      }
      setFormAberto(false);
      lista.recarregar();
    } catch (err) {
      setErroForm(mensagemDaApi(err) || "Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const abrirReceber = (r: Recebimento) => {
    setRecebendo(r);
    setForma("DINHEIRO");
    setDataReceb(hojeISO());
    setErroReceber("");
    setNoCaixa(false);
    setCaixaAberto(false);
    caixaService
      .atual()
      .then((c) => {
        setCaixaAberto(!!c);
        setNoCaixa(!!c);
      })
      .catch(() => setCaixaAberto(false));
  };

  const confirmarReceber = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!recebendo) return;
    setSalvando(true);
    setErroReceber("");
    try {
      await recebimentosService.receber(recebendo.id, forma, dataReceb || null, noCaixa);
      toast.success(noCaixa ? "Recebido e lançado no caixa." : "Recebimento registrado.");
      setRecebendo(null);
      lista.recarregar();
    } catch (err) {
      setErroReceber(mensagemDaApi(err) || "Não foi possível receber. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const desfazer = async (r: Recebimento) => {
    if (!window.confirm(`Desfazer o recebimento de "${r.nome}"? Ele volta a ficar em aberto.`)) {
      return;
    }
    try {
      await recebimentosService.desfazer(r.id);
      toast.success("Recebimento desfeito.");
      lista.recarregar();
    } catch {
      // mensagem pelo interceptor
    }
  };

  const [excluindo, setExcluindo] = useState<Recebimento | null>(null);
  const [erroExcluir, setErroExcluir] = useState("");

  const pedirExclusao = (r: Recebimento) => {
    setErroExcluir("");
    setExcluindo(r);
  };

  const excluir = async (todas: boolean) => {
    if (!excluindo) return;
    setSalvando(true);
    setErroExcluir("");
    try {
      const { excluidos } = await recebimentosService.excluir(excluindo.id, todas);
      toast.success(excluidos > 1 ? `${excluidos} parcelas excluídas.` : "Recebimento excluído.");
      setExcluindo(null);
      lista.recarregar();
    } catch (err) {
      setErroExcluir(mensagemDaApi(err) || "Não foi possível excluir. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const { resumo, itens } = lista.dados;

  return (
    <Layout>
      <PageHeader
        titulo="Recebimentos"
        descricao="Contas a receber dos clientes (fiado), com parcelas e vencimento."
        acoes={
          podeEditar && (
            <Button onClick={novo} data-cy="recebimento-novo">
              Novo recebimento
            </Button>
          )
        }
      />

      <Card className="recebimento-filtros" data-cy="recebimento-filtros">
        <div className="campo-wrapper">
          <label htmlFor="filtro-mes">Mês (vencimento)</label>
          <input
            id="filtro-mes"
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            data-cy="filtro-mes"
          />
        </div>
        <div className="campo-wrapper">
          <label htmlFor="filtro-status">Situação</label>
          <select
            id="filtro-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | StatusRecebimento)}
            data-cy="filtro-status"
          >
            <option value="">Todas</option>
            <option value="ABERTO">Em aberto</option>
            <option value="RECEBIDO">Recebidos</option>
          </select>
        </div>
        <div className="campo-wrapper">
          <label htmlFor="filtro-cliente">Cliente</label>
          <select
            id="filtro-cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            data-cy="filtro-cliente"
          >
            <option value="">Todos</option>
            {clientes.dados.map((c) => (
              <option key={c.id} value={c.id}>
                {nomeCliente(c)}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <section
        className="financeiro-indicadores"
        aria-label="Totais do período"
        data-cy="recebimento-resumo"
      >
        <Card>
          <p className="financeiro-indicador__rotulo">Em aberto no mês</p>
          <p className="financeiro-indicador__valor" data-cy="resumo-aberto">
            {reais(resumo.emAberto)}
          </p>
        </Card>
        <Card>
          <p className="financeiro-indicador__rotulo">Vencido</p>
          <p
            className={`financeiro-indicador__valor ${resumo.vencido > 0 ? "recebimento-vencido" : ""}`}
            data-cy="resumo-vencido"
          >
            {reais(resumo.vencido)}
          </p>
        </Card>
        <Card>
          <p className="financeiro-indicador__rotulo">Recebido no mês</p>
          <p className="financeiro-indicador__valor" data-cy="resumo-recebido">
            {reais(resumo.recebido)}
          </p>
        </Card>
      </section>

      {lista.carregando && <Carregando ativo contexto="Carregando recebimentos..." />}
      {!lista.carregando && lista.erro && (
        <ErrorState mensagem={lista.erro.mensagem} onTentarNovamente={lista.recarregar} />
      )}
      {!lista.carregando && !lista.erro && itens.length === 0 && (
        <EmptyState
          titulo="Nenhum recebimento neste mês"
          texto="Mude os filtros ou crie um novo."
        />
      )}
      {!lista.carregando && !lista.erro && itens.length > 0 && (
        <Card semPadding>
          <div className="tabela-container">
            <table className="tabela-SaaS" data-cy="recebimento-lista">
              <thead>
                <tr>
                  <th scope="col">Vencimento</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Nome</th>
                  <th scope="col">Parcela</th>
                  <th scope="col" className="tabela__num">
                    Valor
                  </th>
                  <th scope="col">Situação</th>
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {itens.map((r) => (
                  <tr key={r.id} data-cy="recebimento-linha">
                    <td>{dataBR(r.vencimento)}</td>
                    <td>{r.nomeCliente}</td>
                    <td>
                      {r.nome}
                      {r.descricao && <div className="texto-ajuda">{r.descricao}</div>}
                    </td>
                    <td>{r.totalParcelas > 1 ? `${r.parcela}/${r.totalParcelas}` : "—"}</td>
                    <td className="tabela__num">{reais(r.valor)}</td>
                    <td>
                      {r.status === "RECEBIDO" ? (
                        <>
                          <Badge tom="marca">Recebido</Badge>
                          <div className="texto-ajuda">
                            {dataBR(r.dataRecebimento)} · {r.forma ? descricaoForma(r.forma) : ""}
                            {r.entrouNoCaixa ? " · no caixa" : ""}
                          </div>
                        </>
                      ) : r.vencido ? (
                        <Badge tom="erro">Vencido</Badge>
                      ) : (
                        <Badge tom="aviso">Em aberto</Badge>
                      )}
                    </td>
                    <td>
                      {podeEditar && (
                        <div className="recebimento-acoes">
                          {r.status === "ABERTO" ? (
                            <>
                              <button
                                type="button"
                                className="link financeiro-link-botao"
                                onClick={() => abrirReceber(r)}
                                data-cy={`receber-${r.id}`}
                              >
                                Receber
                              </button>
                              <button
                                type="button"
                                className="link financeiro-link-botao"
                                onClick={() => editar(r)}
                                data-cy={`editar-${r.id}`}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="link financeiro-link-botao"
                                onClick={() => pedirExclusao(r)}
                                data-cy={`excluir-${r.id}`}
                              >
                                Excluir
                              </button>
                            </>
                          ) : (
                            !r.entrouNoCaixa && (
                              <button
                                type="button"
                                className="link financeiro-link-botao"
                                onClick={() => desfazer(r)}
                                data-cy={`desfazer-${r.id}`}
                              >
                                Desfazer
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        titulo={editando ? "Editar recebimento" : "Novo recebimento"}
        aberto={formAberto}
        onFechar={() => setFormAberto(false)}
        data-cy="modal-recebimento"
        rodape={
          <>
            <Button variante="secundario" onClick={() => setFormAberto(false)}>
              Voltar
            </Button>
            <Button
              type="submit"
              form="form-recebimento"
              carregando={salvando}
              textoCarregando="Salvando..."
              data-cy="recebimento-salvar"
            >
              Salvar
            </Button>
          </>
        }
      >
        <form id="form-recebimento" onSubmit={salvar} noValidate className="financeiro-form">
          {erroForm && (
            <div className="alerta alerta-erro" role="alert" data-cy="recebimento-erro">
              {erroForm}
            </div>
          )}
          <div className="campo-wrapper">
            <label htmlFor="rec-cliente">Cliente *</label>
            <select
              id="rec-cliente"
              value={form.idCliente}
              onChange={campo("idCliente")}
              required
              data-cy="recebimento-cliente"
            >
              <option value="">Escolha o cliente</option>
              {clientes.dados.map((c) => (
                <option key={c.id} value={c.id}>
                  {nomeCliente(c)}
                </option>
              ))}
            </select>
          </div>
          {!editando && <PendenciaCliente idCliente={form.idCliente} />}
          <div className="campo-wrapper">
            <label htmlFor="rec-nome">Nome *</label>
            <input
              id="rec-nome"
              value={form.nome}
              maxLength={255}
              onChange={campo("nome")}
              placeholder="Ex.: Pacote de escova"
              required
              data-cy="recebimento-nome"
            />
          </div>
          <div className="campo-wrapper">
            <label htmlFor="rec-descricao">Descrição</label>
            <input
              id="rec-descricao"
              value={form.descricao}
              maxLength={255}
              onChange={campo("descricao")}
              data-cy="recebimento-descricao"
            />
          </div>
          <div className="recebimento-linha-dupla">
            <div className="campo-wrapper">
              <label htmlFor="rec-valor">{editando ? "Valor *" : "Valor total *"}</label>
              <input
                id="rec-valor"
                inputMode="decimal"
                placeholder="0,00"
                value={form.valor}
                onChange={campo("valor")}
                required
                data-cy="recebimento-valor"
              />
            </div>
            <div className="campo-wrapper">
              <label htmlFor="rec-vencimento">
                {editando ? "Vencimento *" : "Vencimento (1ª parcela) *"}
              </label>
              <input
                id="rec-vencimento"
                type="date"
                value={form.vencimento}
                onChange={campo("vencimento")}
                required
                data-cy="recebimento-vencimento"
              />
            </div>
          </div>
          {!editando && (
            <div className="campo-wrapper">
              <label htmlFor="rec-parcelas">Parcelas (mensais)</label>
              <input
                id="rec-parcelas"
                type="number"
                min={1}
                max={60}
                value={form.parcelas}
                onChange={campo("parcelas")}
                data-cy="recebimento-parcelas"
              />
              <p className="texto-ajuda">
                O valor é dividido igualmente; os centavos que sobrarem ficam na 1ª parcela.
              </p>
            </div>
          )}
          {editando && editando.totalParcelas > 1 && (
            <p className="texto-ajuda">
              Você está editando só a parcela {editando.parcela}/{editando.totalParcelas}.
            </p>
          )}
        </form>
      </Modal>

      <Modal
        titulo="Receber"
        aberto={recebendo !== null}
        onFechar={() => setRecebendo(null)}
        data-cy="modal-receber"
        rodape={
          <>
            <Button variante="secundario" onClick={() => setRecebendo(null)}>
              Voltar
            </Button>
            <Button
              type="submit"
              form="form-receber"
              carregando={salvando}
              textoCarregando="Salvando..."
              data-cy="receber-confirmar"
            >
              Confirmar recebimento
            </Button>
          </>
        }
      >
        <form id="form-receber" onSubmit={confirmarReceber} noValidate className="financeiro-form">
          {erroReceber && (
            <div className="alerta alerta-erro" role="alert" data-cy="receber-erro">
              {erroReceber}
            </div>
          )}
          {recebendo && (
            <p>
              {recebendo.nomeCliente} · {recebendo.nome}
              {recebendo.totalParcelas > 1 &&
                ` (${recebendo.parcela}/${recebendo.totalParcelas})`}:{" "}
              <strong>{reais(recebendo.valor)}</strong>
            </p>
          )}
          <div className="recebimento-linha-dupla">
            <div className="campo-wrapper">
              <label htmlFor="receber-forma">Forma de pagamento</label>
              <select
                id="receber-forma"
                value={forma}
                onChange={(e) => setForma(e.target.value as FormaPagamento)}
                data-cy="receber-forma"
              >
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f.forma} value={f.forma}>
                    {f.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo-wrapper">
              <label htmlFor="receber-data">Data do recebimento</label>
              <input
                id="receber-data"
                type="date"
                max={hojeISO()}
                value={dataReceb}
                onChange={(e) => setDataReceb(e.target.value)}
                data-cy="receber-data"
              />
            </div>
          </div>
          <label className="recebimento-check" htmlFor="receber-caixa">
            <input
              id="receber-caixa"
              type="checkbox"
              checked={noCaixa}
              disabled={!caixaAberto}
              onChange={(e) => setNoCaixa(e.target.checked)}
              data-cy="receber-no-caixa"
            />
            Entrou no caixa aberto?
          </label>
          <p className="texto-ajuda">
            {caixaAberto
              ? "Marcado: o valor entra no caixa como recebimento e não poderá ser desfeito."
              : "Não há caixa aberto: o recebimento fica só registrado aqui."}
          </p>
        </form>
      </Modal>

      <Modal
        titulo="Excluir recebimento"
        aberto={excluindo !== null}
        onFechar={() => setExcluindo(null)}
        data-cy="modal-excluir"
        rodape={
          <>
            <Button variante="secundario" onClick={() => setExcluindo(null)}>
              Voltar
            </Button>
            {excluindo && excluindo.totalParcelas > 1 && (
              <Button
                variante="perigo"
                carregando={salvando}
                onClick={() => excluir(true)}
                data-cy="excluir-todas"
              >
                Todas as {excluindo.totalParcelas} parcelas
              </Button>
            )}
            <Button
              variante="perigo"
              carregando={salvando}
              onClick={() => excluir(false)}
              data-cy="excluir-confirmar"
            >
              {excluindo && excluindo.totalParcelas > 1 ? "Só esta parcela" : "Excluir"}
            </Button>
          </>
        }
      >
        {erroExcluir && (
          <div className="alerta alerta-erro" role="alert" data-cy="excluir-erro">
            {erroExcluir}
          </div>
        )}
        {excluindo && (
          <p>
            Excluir “{excluindo.nome}” de {excluindo.nomeCliente}
            {excluindo.totalParcelas > 1 &&
              ` (parcela ${excluindo.parcela}/${excluindo.totalParcelas})`}
            ? Não dá para desfazer.
          </p>
        )}
      </Modal>
    </Layout>
  );
}
