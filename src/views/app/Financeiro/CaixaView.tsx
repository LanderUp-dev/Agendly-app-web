// @requisito RE-06 RO-05 RO-07 RO-09 RO-10 RO-11 RO-21 RNR-08 RNR-09 RNR-10
import React, { useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Layout } from "@/components/layout/Layout";
import { Badge, Button, Card, Carregando, ErrorState, Modal, PageHeader } from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { lerValor, reais } from "@/lib/dinheiro";
import {
  caixaService,
  comandaService,
  descricaoForma,
  FORMAS_PAGAMENTO,
  ROTULO_MOVIMENTO,
  type Caixa,
} from "@/services/financeiro";
import "./Financeiro.css";

const dataHora = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const hojeISO = () => new Date().toLocaleDateString("sv-SE");
const diasAtras = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("sv-SE");
};

const mensagemDaApi = (err: unknown) => {
  const dados = isAxiosError(err) ? err.response?.data : undefined;
  return typeof dados === "string" && dados.length < 200 ? dados : "";
};

type Acao = "abrir" | "SUPRIMENTO" | "SANGRIA" | "fechar" | null;

/** Caixa da loja: abrir, suprimento, sangria, fechar (com conferência), comandas e histórico. */
export default function CaixaView() {
  const atual = useCarregar<Caixa | null>(() => caixaService.atual(), null);
  const historico = useCarregar<Caixa[]>(
    () => caixaService.historico(diasAtras(30), hojeISO()),
    [],
  );
  const [acao, setAcao] = useState<Acao>(null);
  const [valor, setValor] = useState("");
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const caixa = atual.dados;

  const recarregar = () => {
    atual.recarregar();
    historico.recarregar();
  };

  const abrirAcao = (a: Acao) => {
    setAcao(a);
    setValor(a === "fechar" && caixa ? "" : "");
    setTexto("");
    setErro("");
  };

  const confirmar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = lerValor(valor);
    if (acao !== "fechar" && (v === null || v < 0)) {
      setErro("Informe um valor válido.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      if (acao === "abrir") {
        await caixaService.abrir(v ?? 0);
        toast.success("Caixa aberto.");
      } else if (acao === "SUPRIMENTO" || acao === "SANGRIA") {
        await caixaService.movimentar(acao, v ?? 0, texto || undefined);
        toast.success(acao === "SANGRIA" ? "Sangria registrada." : "Suprimento registrado.");
      } else if (acao === "fechar") {
        const fechado = await caixaService.fechar(v, texto || undefined);
        const dif = fechado.diferenca;
        toast.success(
          dif == null || dif === 0
            ? "Caixa fechado."
            : `Caixa fechado com ${dif > 0 ? "sobra" : "falta"} de ${reais(Math.abs(dif))}.`,
        );
      }
      setAcao(null);
      recarregar();
    } catch (err) {
      setErro(mensagemDaApi(err) || "Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const cancelarComanda = async (id: number) => {
    const motivo = window.prompt("Motivo do cancelamento (o valor sai do caixa):");
    if (!motivo?.trim()) return;
    try {
      await comandaService.cancelar(id, motivo.trim());
      toast.success("Comanda cancelada e estornada.");
      recarregar();
    } catch {
      // mensagem pelo interceptor
    }
  };

  const reabrir = async (id: number) => {
    if (!window.confirm("Reabrir este caixa? Ele volta a receber lançamentos.")) return;
    try {
      await caixaService.reabrir(id);
      toast.success("Caixa reaberto.");
      recarregar();
    } catch {
      // mensagem pelo interceptor
    }
  };

  const tituloAcao: Record<Exclude<Acao, null>, string> = {
    abrir: "Abrir caixa",
    SUPRIMENTO: "Suprimento (colocar dinheiro)",
    SANGRIA: "Sangria (retirar dinheiro)",
    fechar: "Fechar caixa",
  };

  const ultimoFechado = historico.dados.find((c) => c.status === "FECHADO");
  const podeReabrir = !caixa && ultimoFechado && historico.dados[0]?.id === ultimoFechado.id;

  return (
    <Layout>
      <PageHeader
        titulo="Caixa"
        descricao="Abra o caixa no início do dia. Os atendimentos fechados na agenda entram aqui."
        acoes={
          caixa ? (
            <>
              <Button
                variante="secundario"
                onClick={() => abrirAcao("SUPRIMENTO")}
                data-cy="caixa-suprimento"
              >
                Suprimento
              </Button>
              <Button
                variante="secundario"
                onClick={() => abrirAcao("SANGRIA")}
                data-cy="caixa-sangria"
              >
                Sangria
              </Button>
              <Button variante="perigo" onClick={() => abrirAcao("fechar")} data-cy="caixa-fechar">
                Fechar caixa
              </Button>
            </>
          ) : (
            !atual.carregando && (
              <Button onClick={() => abrirAcao("abrir")} data-cy="caixa-abrir">
                Abrir caixa
              </Button>
            )
          )
        }
      />

      {atual.carregando && <Carregando ativo contexto="Carregando o caixa..." />}
      {!atual.carregando && atual.erro && (
        <ErrorState mensagem={atual.erro.mensagem} onTentarNovamente={atual.recarregar} />
      )}

      {!atual.carregando && !atual.erro && !caixa && (
        <Card data-cy="caixa-fechado">
          <p>
            <Badge>Caixa fechado</Badge>
          </p>
          <p className="texto-ajuda">
            Sem caixa aberto não dá para fechar atendimentos na agenda.
            {podeReabrir && (
              <>
                {" "}
                Fechou antes da hora?{" "}
                <button
                  type="button"
                  className="link financeiro-link-botao"
                  onClick={() => reabrir(ultimoFechado!.id)}
                  data-cy="caixa-reabrir"
                >
                  Reabrir o último caixa
                </button>
              </>
            )}
          </p>
        </Card>
      )}

      {caixa && (
        <>
          <section
            className="financeiro-indicadores"
            aria-label="Resumo do caixa"
            data-cy="caixa-resumo"
          >
            <Card>
              <p className="financeiro-indicador__rotulo">Dinheiro na gaveta</p>
              <p className="financeiro-indicador__valor" data-cy="caixa-saldo">
                {reais(caixa.saldoDinheiro)}
              </p>
              <p className="texto-ajuda">
                Inicial {reais(caixa.valorInicial)} · +{reais(caixa.suprimentos)} · −
                {reais(caixa.sangrias)}
              </p>
            </Card>
            <Card>
              <p className="financeiro-indicador__rotulo">Recebido hoje</p>
              <p className="financeiro-indicador__valor" data-cy="caixa-vendas">
                {reais(caixa.vendas)}
              </p>
              <p className="texto-ajuda">
                {caixa.comandas.filter((c) => c.status === "FECHADA").length} atendimento(s)
              </p>
            </Card>
            <Card>
              <p className="financeiro-indicador__rotulo">Por forma de pagamento</p>
              <ul className="financeiro-formas" data-cy="caixa-formas">
                {FORMAS_PAGAMENTO.filter((f) => caixa.vendasPorForma[f.forma]).map((f) => (
                  <li key={f.forma}>
                    <span>{f.descricao}</span>
                    <strong>{reais(caixa.vendasPorForma[f.forma])}</strong>
                  </li>
                ))}
                {Object.keys(caixa.vendasPorForma).length === 0 && <li>Nenhuma venda ainda</li>}
              </ul>
            </Card>
          </section>
          <p className="texto-ajuda">Aberto em {dataHora(caixa.abertoEm)}.</p>

          <Card como="section" className="financeiro-secao">
            <h2 className="financeiro-secao__titulo">Atendimentos</h2>
            {caixa.comandas.length === 0 ? (
              <p className="texto-ajuda">
                Nenhum atendimento fechado. Na agenda, clique no horário e em “Fechar atendimento”.
              </p>
            ) : (
              <div className="tabela-container">
                <table className="tabela-SaaS" data-cy="caixa-comandas">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Hora</th>
                      <th scope="col">Cliente</th>
                      <th scope="col">Serviços</th>
                      <th scope="col">Pagamento</th>
                      <th scope="col" className="tabela__num">
                        Total
                      </th>
                      <th scope="col">
                        <span className="sr-only">Ações</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {caixa.comandas.map((c) => (
                      <tr
                        key={c.id}
                        className={c.status === "CANCELADA" ? "financeiro-cancelada" : ""}
                      >
                        <td>{c.id}</td>
                        <td>{dataHora(c.criadaEm).slice(-5)}</td>
                        <td>{c.cliente || "—"}</td>
                        <td>{c.itens.map((i) => `${i.servico} (${i.funcionario})`).join(", ")}</td>
                        <td>
                          {c.pagamentos.map((p) => descricaoForma(p.forma)).join(" + ")}
                          {c.troco > 0 && ` · troco ${reais(c.troco)}`}
                        </td>
                        <td className="tabela__num">{reais(c.total)}</td>
                        <td>
                          {c.status === "CANCELADA" ? (
                            <Badge tom="erro">Cancelada</Badge>
                          ) : (
                            <button
                              type="button"
                              className="link financeiro-link-botao"
                              onClick={() => cancelarComanda(c.id)}
                              data-cy={`cancelar-comanda-${c.id}`}
                            >
                              Cancelar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card como="section" className="financeiro-secao">
            <h2 className="financeiro-secao__titulo">Movimentos</h2>
            {caixa.movimentos.length === 0 ? (
              <p className="texto-ajuda">Nenhum movimento ainda.</p>
            ) : (
              <ul className="financeiro-movimentos" data-cy="caixa-movimentos">
                {caixa.movimentos.map((m) => (
                  <li key={m.id}>
                    <span>{dataHora(m.criadoEm).slice(-5)}</span>
                    <span>
                      {ROTULO_MOVIMENTO[m.tipo]} · {descricaoForma(m.forma)}
                      {m.descricao ? ` · ${m.descricao}` : ""}
                    </span>
                    <strong className={m.entrada ? "financeiro-entrada" : "financeiro-saida"}>
                      {m.entrada ? "+" : "−"}
                      {reais(m.valor)}
                    </strong>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      <Card como="section" className="financeiro-secao">
        <h2 className="financeiro-secao__titulo">Últimos 30 dias</h2>
        {historico.dados.filter((c) => c.status === "FECHADO").length === 0 ? (
          <p className="texto-ajuda">Nenhum caixa fechado no período.</p>
        ) : (
          <div className="tabela-container">
            <table className="tabela-SaaS" data-cy="caixa-historico">
              <thead>
                <tr>
                  <th scope="col">Abertura</th>
                  <th scope="col">Fechamento</th>
                  <th scope="col" className="tabela__num">
                    Vendas
                  </th>
                  <th scope="col" className="tabela__num">
                    Dinheiro esperado
                  </th>
                  <th scope="col" className="tabela__num">
                    Contado
                  </th>
                  <th scope="col" className="tabela__num">
                    Diferença
                  </th>
                </tr>
              </thead>
              <tbody>
                {historico.dados
                  .filter((c) => c.status === "FECHADO")
                  .map((c) => (
                    <tr key={c.id}>
                      <td>{dataHora(c.abertoEm)}</td>
                      <td>{dataHora(c.fechadoEm)}</td>
                      <td className="tabela__num">{reais(c.vendas)}</td>
                      <td className="tabela__num">{reais(c.saldoDinheiro)}</td>
                      <td className="tabela__num">
                        {c.valorContado == null ? "—" : reais(c.valorContado)}
                      </td>
                      <td
                        className={`tabela__num ${c.diferenca && c.diferenca < 0 ? "financeiro-saida" : ""}`}
                      >
                        {c.diferenca == null ? "—" : reais(c.diferenca)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        titulo={acao ? tituloAcao[acao] : ""}
        aberto={acao !== null}
        onFechar={() => setAcao(null)}
        data-cy="modal-caixa"
        rodape={
          <>
            <Button variante="secundario" onClick={() => setAcao(null)}>
              Voltar
            </Button>
            <Button
              type="submit"
              form="form-caixa"
              carregando={salvando}
              textoCarregando="Salvando..."
              variante={acao === "fechar" || acao === "SANGRIA" ? "perigo" : "primario"}
              data-cy="caixa-confirmar"
            >
              {acao ? tituloAcao[acao].split(" (")[0] : "Salvar"}
            </Button>
          </>
        }
      >
        <form id="form-caixa" onSubmit={confirmar} noValidate className="financeiro-form">
          {erro && (
            <div className="alerta alerta-erro" role="alert" data-cy="caixa-erro">
              {erro}
            </div>
          )}
          {acao === "fechar" && caixa && (
            <p>
              Dinheiro esperado na gaveta: <strong>{reais(caixa.saldoDinheiro)}</strong>. Conte e
              informe abaixo para registrar sobra ou falta (opcional).
            </p>
          )}
          {acao === "SANGRIA" && caixa && (
            <p className="texto-ajuda">Disponível em dinheiro: {reais(caixa.saldoDinheiro)}.</p>
          )}
          <div className="campo-wrapper">
            <label htmlFor="caixa-valor">
              {acao === "abrir"
                ? "Valor inicial (troco na gaveta)"
                : acao === "fechar"
                  ? "Dinheiro contado"
                  : "Valor"}
            </label>
            <input
              id="caixa-valor"
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required={acao !== "fechar"}
              data-cy="caixa-valor"
            />
          </div>
          {acao !== "abrir" && (
            <div className="campo-wrapper">
              <label htmlFor="caixa-texto">{acao === "fechar" ? "Observação" : "Descrição"}</label>
              <input
                id="caixa-texto"
                value={texto}
                maxLength={255}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={acao === "SANGRIA" ? "Ex.: depósito no banco" : ""}
                data-cy="caixa-texto"
              />
            </div>
          )}
        </form>
      </Modal>
    </Layout>
  );
}
