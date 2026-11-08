// @requisito RE-08 RR-33 RR-35 RR-37 RO-22 RNR-16 RNR-18 RNF-01 RNF-05
import React, { useState } from "react";
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
import { cobrancistasService } from "@/services/endpoints";
import {
  caixaService,
  descricaoForma,
  FORMAS_PAGAMENTO,
  type Caixa,
  type FormaPagamento,
} from "@/services/financeiro";
import {
  despesasService,
  type Despesa,
  type ListaDespesas,
  type StatusDespesa,
} from "@/services/despesas";
import { dataBR, dividirParcelas, mesAtual, periodoDoMes } from "./despesaUtil";
import "../Financeiro/Financeiro.css";
import "./Despesa.css";

const hojeISO = () => new Date().toLocaleDateString("sv-SE");

const mensagemDaApi = (err: unknown) => {
  const dados = isAxiosError(err) ? err.response?.data : undefined;
  return typeof dados === "string" && dados.length < 300 ? dados : "";
};

const VAZIA: ListaDespesas = {
  de: "",
  ate: "",
  despesas: [],
  resumo: { totalAberto: 0, totalVencido: 0, totalPago: 0 },
};

interface Form {
  nome: string;
  descricao: string;
  valor: string;
  vencimento: string;
  parcelas: string;
  cobrancistas: number[];
}

const FORM_VAZIO = (): Form => ({
  nome: "",
  descricao: "",
  valor: "",
  vencimento: hojeISO(),
  parcelas: "1",
  cobrancistas: [],
});

/** Contas a pagar: filtro por mês e status, totais, criar em parcelas, pagar e desfazer. */
export default function DespesasView() {
  const [mes, setMes] = useState(mesAtual());
  const [status, setStatus] = useState<StatusDespesa | "">("");
  const podeEditar = temPermissao("DESPESA_EDITAR");

  const lista = useCarregar<ListaDespesas>(() => {
    const { de, ate } = periodoDoMes(mes || mesAtual());
    return despesasService.listar(de, ate, status || undefined);
  }, VAZIA);
  const cobrancistas = useCarregar<{ id: number; nome: string }[]>(
    () => (podeEditar ? cobrancistasService.listar().catch(() => []) : Promise.resolve([])),
    [],
  );

  // criar / editar
  const [editando, setEditando] = useState<Despesa | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState<Form>(FORM_VAZIO());

  // pagar
  const [pagando, setPagando] = useState<Despesa | null>(null);
  const [forma, setForma] = useState<FormaPagamento>("PIX");
  const [dataPagamento, setDataPagamento] = useState(hojeISO());
  const [saiDoCaixa, setSaiDoCaixa] = useState(false);
  const [caixa, setCaixa] = useState<Caixa | null | undefined>(undefined);

  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const mudarFiltro = (novoMes: string, novoStatus: StatusDespesa | "") => {
    setMes(novoMes);
    setStatus(novoStatus);
    lista.recarregar();
  };

  const novo = () => {
    setEditando(null);
    setForm(FORM_VAZIO());
    setErro("");
    setFormAberto(true);
  };

  const editar = (d: Despesa) => {
    setEditando(d);
    setForm({
      nome: d.nome,
      descricao: d.descricao ?? "",
      valor: paraCampo(d.valor),
      vencimento: d.vencimento,
      parcelas: "1",
      cobrancistas: d.cobrancistas.map((c) => c.id),
    });
    setErro("");
    setFormAberto(true);
  };

  const alternarCobrancista = (id: number) =>
    setForm((f) => ({
      ...f,
      cobrancistas: f.cobrancistas.includes(id)
        ? f.cobrancistas.filter((x) => x !== id)
        : [...f.cobrancistas, id],
    }));

  const valorForm = lerValor(form.valor);
  const parcelasForm = Number(form.parcelas);
  const previa =
    !editando && valorForm && parcelasForm > 1 ? dividirParcelas(valorForm, parcelasForm) : [];

  const salvar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.nome.trim()) return setErro("Informe o nome da despesa.");
    if (valorForm === null || valorForm <= 0) return setErro("Informe um valor maior que zero.");
    if (!form.vencimento) return setErro("Informe o vencimento.");
    if (!editando && (!Number.isInteger(parcelasForm) || parcelasForm < 1 || parcelasForm > 60)) {
      return setErro("O número de parcelas deve ser de 1 a 60.");
    }
    setSalvando(true);
    setErro("");
    const dados = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || undefined,
      valor: valorForm,
      vencimento: form.vencimento,
      parcelas: editando ? undefined : parcelasForm,
      cobrancistas: form.cobrancistas,
    };
    try {
      if (editando) {
        await despesasService.editar(editando.id, dados);
        toast.success("Despesa atualizada.");
      } else {
        const criadas = await despesasService.criar(dados);
        toast.success(
          criadas.length > 1 ? `${criadas.length} parcelas criadas.` : "Despesa cadastrada.",
        );
      }
      setFormAberto(false);
      lista.recarregar();
    } catch (err) {
      setErro(mensagemDaApi(err) || "Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const abrirPagar = (d: Despesa) => {
    setPagando(d);
    setForma("PIX");
    setDataPagamento(hojeISO());
    setSaiDoCaixa(false);
    setErro("");
    setCaixa(undefined);
    caixaService
      .atual()
      .then(setCaixa)
      .catch(() => setCaixa(null));
  };

  const pagar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pagando) return;
    setSalvando(true);
    setErro("");
    try {
      await despesasService.pagar(pagando.id, {
        forma,
        data: saiDoCaixa ? undefined : dataPagamento || undefined,
        saiDoCaixa,
      });
      toast.success(saiDoCaixa ? "Despesa paga e lançada no caixa." : "Despesa paga.");
      setPagando(null);
      lista.recarregar();
    } catch (err) {
      setErro(mensagemDaApi(err) || "Não foi possível pagar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const desfazer = async (d: Despesa) => {
    if (!window.confirm(`Desfazer o pagamento de "${d.nome}"? Ela volta a ficar em aberto.`)) {
      return;
    }
    try {
      await despesasService.desfazerPagamento(d.id);
      toast.success("Pagamento desfeito.");
      lista.recarregar();
    } catch {
      // mensagem pelo interceptor
    }
  };

  const excluir = async (d: Despesa) => {
    let todas = false;
    if (d.totalParcelas > 1) {
      todas = window.confirm(
        `"${d.nome}" tem ${d.totalParcelas} parcelas. OK = excluir todas as parcelas em aberto; ` +
          "Cancelar = escolher excluir só esta.",
      );
    }
    if (
      !todas &&
      !window.confirm(`Excluir "${d.nome}"${rotuloParcela(d)}? Não dá para desfazer.`)
    ) {
      return;
    }
    try {
      const r = await despesasService.excluir(d.id, todas);
      toast.success(r.excluidas > 1 ? `${r.excluidas} parcelas excluídas.` : "Despesa excluída.");
      lista.recarregar();
    } catch {
      // mensagem pelo interceptor
    }
  };

  const { despesas, resumo } = lista.dados;
  const saldoDinheiro = caixa?.saldoDinheiro ?? 0;
  const faltaDinheiro =
    saiDoCaixa && forma === "DINHEIRO" && pagando !== null && pagando.valor > saldoDinheiro;

  return (
    <Layout>
      <PageHeader
        titulo="Despesas"
        descricao="Contas a pagar da loja. Cadastre, divida em parcelas e marque como paga."
        acoes={
          podeEditar && (
            <Button onClick={novo} data-cy="despesa-nova">
              Nova despesa
            </Button>
          )
        }
      />

      <Card className="despesa-filtros">
        <div className="campo-wrapper">
          <label htmlFor="despesa-mes">Mês (vencimento)</label>
          <input
            id="despesa-mes"
            type="month"
            value={mes}
            onChange={(e) => e.target.value && mudarFiltro(e.target.value, status)}
            data-cy="despesa-filtro-mes"
          />
        </div>
        <div className="campo-wrapper">
          <label htmlFor="despesa-status">Situação</label>
          <select
            id="despesa-status"
            value={status}
            onChange={(e) => mudarFiltro(mes, e.target.value as StatusDespesa | "")}
            data-cy="despesa-filtro-status"
          >
            <option value="">Todas</option>
            <option value="ABERTA">Em aberto</option>
            <option value="PAGA">Pagas</option>
          </select>
        </div>
      </Card>

      <section
        className="financeiro-indicadores"
        aria-label="Totais do mês"
        data-cy="despesa-totais"
      >
        <Card>
          <p className="financeiro-indicador__rotulo">Em aberto</p>
          <p className="financeiro-indicador__valor" data-cy="despesa-total-aberto">
            {reais(resumo.totalAberto)}
          </p>
          <p className="texto-ajuda">Vencem neste mês e ainda não foram pagas</p>
        </Card>
        <Card>
          <p className="financeiro-indicador__rotulo">Vencidas</p>
          <p
            className={`financeiro-indicador__valor ${resumo.totalVencido > 0 ? "financeiro-saida" : ""}`}
            data-cy="despesa-total-vencido"
          >
            {reais(resumo.totalVencido)}
          </p>
          <p className="texto-ajuda">Em aberto com vencimento antes de hoje</p>
        </Card>
        <Card>
          <p className="financeiro-indicador__rotulo">Pagas</p>
          <p className="financeiro-indicador__valor" data-cy="despesa-total-pago">
            {reais(resumo.totalPago)}
          </p>
          <p className="texto-ajuda">Pagamentos feitos neste mês</p>
        </Card>
      </section>

      {lista.carregando && <Carregando ativo contexto="Carregando as despesas..." />}
      {!lista.carregando && lista.erro && (
        <ErrorState mensagem={lista.erro.mensagem} onTentarNovamente={lista.recarregar} />
      )}
      {!lista.carregando && !lista.erro && despesas.length === 0 && (
        <EmptyState
          titulo="Nenhuma despesa neste mês"
          texto="Cadastre as contas a pagar para acompanhar o que vence e o que já foi pago."
        />
      )}
      {!lista.carregando && !lista.erro && despesas.length > 0 && (
        <div className="tabela-container">
          <table className="tabela-SaaS" data-cy="despesa-lista">
            <thead>
              <tr>
                <th scope="col">Vencimento</th>
                <th scope="col">Despesa</th>
                <th scope="col">Cobrancista</th>
                <th scope="col">Situação</th>
                <th scope="col" className="tabela__num">
                  Valor
                </th>
                <th scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {despesas.map((d) => (
                <tr key={d.id} data-cy="despesa-linha">
                  <td>{dataBR(d.vencimento)}</td>
                  <td>
                    <strong>{d.nome}</strong>
                    {rotuloParcela(d)}
                    {d.descricao && <div className="texto-ajuda">{d.descricao}</div>}
                  </td>
                  <td>{d.cobrancistas.map((c) => c.nome).join(", ") || "—"}</td>
                  <td>
                    {d.status === "PAGA" ? (
                      <>
                        <Badge tom="marca">Paga</Badge>
                        <div className="texto-ajuda">
                          {dataBR(d.dataPagamento)} · {descricaoForma(d.formaPagamento ?? "")}
                          {d.saiuDoCaixa && " · saiu do caixa"}
                        </div>
                      </>
                    ) : d.vencida ? (
                      <Badge tom="erro">Vencida</Badge>
                    ) : (
                      <Badge>Em aberto</Badge>
                    )}
                  </td>
                  <td className="tabela__num">{reais(d.valor)}</td>
                  <td>
                    {podeEditar && (
                      <div className="despesa-acoes">
                        {d.status === "ABERTA" ? (
                          <>
                            <button
                              type="button"
                              className="link financeiro-link-botao"
                              onClick={() => abrirPagar(d)}
                              data-cy="despesa-pagar"
                            >
                              Pagar
                            </button>
                            <button
                              type="button"
                              className="link financeiro-link-botao"
                              onClick={() => editar(d)}
                              data-cy="despesa-editar"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="link financeiro-link-botao financeiro-saida"
                              onClick={() => excluir(d)}
                              data-cy="despesa-excluir"
                            >
                              Excluir
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="link financeiro-link-botao"
                            onClick={() => desfazer(d)}
                            data-cy="despesa-desfazer"
                          >
                            Desfazer pagamento
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        titulo={editando ? "Editar despesa" : "Nova despesa"}
        aberto={formAberto}
        onFechar={() => setFormAberto(false)}
        data-cy="modal-despesa"
        rodape={
          <>
            <Button variante="secundario" onClick={() => setFormAberto(false)}>
              Voltar
            </Button>
            <Button
              type="submit"
              form="form-despesa"
              carregando={salvando}
              textoCarregando="Salvando..."
              data-cy="despesa-salvar"
            >
              Salvar
            </Button>
          </>
        }
      >
        <form id="form-despesa" onSubmit={salvar} noValidate className="financeiro-form">
          {erro && (
            <div className="alerta alerta-erro" role="alert" data-cy="despesa-erro">
              {erro}
            </div>
          )}
          <div className="campo-wrapper">
            <label htmlFor="despesa-nome">Nome *</label>
            <input
              id="despesa-nome"
              value={form.nome}
              maxLength={255}
              required
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex.: Conta de luz"
              data-cy="despesa-nome"
            />
          </div>
          <div className="campo-wrapper">
            <label htmlFor="despesa-descricao">Descrição</label>
            <input
              id="despesa-descricao"
              value={form.descricao}
              maxLength={255}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              data-cy="despesa-descricao"
            />
          </div>
          <div className="despesa-linha-campos">
            <div className="campo-wrapper">
              <label htmlFor="despesa-valor">{editando ? "Valor *" : "Valor total *"}</label>
              <input
                id="despesa-valor"
                inputMode="decimal"
                placeholder="0,00"
                value={form.valor}
                required
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                data-cy="despesa-valor"
              />
            </div>
            <div className="campo-wrapper">
              <label htmlFor="despesa-vencimento">
                {editando ? "Vencimento *" : "1º vencimento *"}
              </label>
              <input
                id="despesa-vencimento"
                type="date"
                value={form.vencimento}
                required
                onChange={(e) => setForm({ ...form, vencimento: e.target.value })}
                data-cy="despesa-vencimento"
              />
            </div>
            {!editando && (
              <div className="campo-wrapper">
                <label htmlFor="despesa-parcelas">Parcelas</label>
                <input
                  id="despesa-parcelas"
                  type="number"
                  min={1}
                  max={60}
                  value={form.parcelas}
                  onChange={(e) => setForm({ ...form, parcelas: e.target.value })}
                  data-cy="despesa-parcelas"
                />
              </div>
            )}
          </div>
          {editando && editando.totalParcelas > 1 && (
            <p className="texto-ajuda">
              Você está editando só a parcela {editando.parcela}/{editando.totalParcelas}.
            </p>
          )}
          {previa.length > 0 && (
            <p className="texto-ajuda" data-cy="despesa-previa">
              {previa.length} parcelas mensais: {reais(previa[0])}
              {previa.length > 1 &&
                previa[1] !== previa[0] &&
                ` e ${previa.length - 1}× ${reais(previa[1])}`}
              {previa.length > 1 && previa[1] === previa[0] && " cada"}.
            </p>
          )}
          <fieldset className="comanda__grupo">
            <legend>Cobrancistas</legend>
            {cobrancistas.dados.length === 0 ? (
              <p className="texto-ajuda">Nenhum cobrancista cadastrado.</p>
            ) : (
              <div className="despesa-cobrancistas" data-cy="despesa-cobrancistas">
                {cobrancistas.dados.map((c) => (
                  <label key={c.id} className="opcao-inline">
                    <input
                      type="checkbox"
                      checked={form.cobrancistas.includes(c.id)}
                      onChange={() => alternarCobrancista(c.id)}
                      data-cy={`despesa-cobrancista-${c.id}`}
                    />
                    {c.nome}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </form>
      </Modal>

      <Modal
        titulo="Pagar despesa"
        aberto={pagando !== null}
        onFechar={() => setPagando(null)}
        data-cy="modal-pagar-despesa"
        rodape={
          <>
            <Button variante="secundario" onClick={() => setPagando(null)}>
              Voltar
            </Button>
            <Button
              type="submit"
              form="form-pagar-despesa"
              carregando={salvando}
              textoCarregando="Salvando..."
              data-cy="despesa-confirmar-pagamento"
            >
              Confirmar pagamento
            </Button>
          </>
        }
      >
        {pagando && (
          <form id="form-pagar-despesa" onSubmit={pagar} noValidate className="financeiro-form">
            {erro && (
              <div className="alerta alerta-erro" role="alert" data-cy="despesa-pagar-erro">
                {erro}
              </div>
            )}
            <p>
              {pagando.nome}
              {rotuloParcela(pagando)}: <strong>{reais(pagando.valor)}</strong> (vence{" "}
              {dataBR(pagando.vencimento)})
            </p>
            <div className="campo-wrapper">
              <label htmlFor="despesa-forma">Forma de pagamento</label>
              <select
                id="despesa-forma"
                value={forma}
                onChange={(e) => setForma(e.target.value as FormaPagamento)}
                data-cy="despesa-forma"
              >
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f.forma} value={f.forma}>
                    {f.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div className="opcao-inline-linha">
              <label className="opcao-inline">
                <input
                  type="checkbox"
                  checked={saiDoCaixa}
                  disabled={caixa === null}
                  onChange={(e) => setSaiDoCaixa(e.target.checked)}
                  data-cy="despesa-sai-do-caixa"
                />
                Saiu do caixa aberto?
              </label>
            </div>
            <p className="texto-ajuda" data-cy="despesa-caixa-info">
              {caixa === undefined
                ? "Consultando o caixa..."
                : caixa === null
                  ? "Não há caixa aberto: o pagamento fica registrado só aqui."
                  : `Dinheiro no caixa aberto: ${reais(caixa.saldoDinheiro)}.`}
            </p>
            {faltaDinheiro && (
              <p className="texto-ajuda financeiro-saida" role="alert">
                O valor é maior que o dinheiro no caixa.
              </p>
            )}
            {saiDoCaixa ? (
              <p className="texto-ajuda">Pagamento pelo caixa fica com a data de hoje.</p>
            ) : (
              <div className="campo-wrapper">
                <label htmlFor="despesa-data-pagamento">Data do pagamento</label>
                <input
                  id="despesa-data-pagamento"
                  type="date"
                  value={dataPagamento}
                  max={hojeISO()}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  data-cy="despesa-data-pagamento"
                />
              </div>
            )}
          </form>
        )}
      </Modal>
    </Layout>
  );
}

function rotuloParcela(d: Despesa) {
  return d.totalParcelas > 1 ? ` (${d.parcela}/${d.totalParcelas})` : "";
}
