// @requisito RO-01 RO-02 RO-03 RO-08 RND-03 RNR-05 RNR-06 RNR-07
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
  Paginacao,
} from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { lerValor, reais } from "@/lib/dinheiro";
import { temPermissao } from "@/lib/permissoes";
import { descricaoForma, FORMAS_PAGAMENTO, type FormaPagamento } from "@/services/financeiro";
import {
  salarioService,
  type Extrato,
  type Pagina,
  type PagamentoSalario,
  type SalarioResumo,
} from "@/services/salarios";
import "../Financeiro/Financeiro.css";
import "./Salario.css";

const data = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR") : "—");

const dataHora = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const mensagemDaApi = (err: unknown) => {
  const dados = isAxiosError(err) ? err.response?.data : undefined;
  return typeof dados === "string" && dados.length < 300 ? dados : "";
};

type Acao = "extrato" | "adiantamento" | "pagar";

/**
 * Salários por comissão: quanto cada profissional tem a receber desde o último pagamento
 * (parte dele nos serviços das comandas fechadas − adiantamentos), extrato, adiantamento e pagamento.
 */
export default function SalariosView() {
  const lista = useCarregar<SalarioResumo[]>(() => salarioService.listar(), []);
  const pode = temPermissao("SALARIO_GERENCIAR");

  const [acao, setAcao] = useState<Acao | null>(null);
  const [selecionado, setSelecionado] = useState<SalarioResumo | null>(null);

  // extrato
  const [extrato, setExtrato] = useState<Extrato | null>(null);
  const [historico, setHistorico] = useState<Pagina<PagamentoSalario> | null>(null);
  const [carregandoExtrato, setCarregandoExtrato] = useState(false);
  const [erroExtrato, setErroExtrato] = useState("");

  // formulários
  const [valor, setValor] = useState("");
  const [forma, setForma] = useState<FormaPagamento>("DINHEIRO");
  const [saiDoCaixa, setSaiDoCaixa] = useState<boolean | null>(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const fechar = () => setAcao(null);

  const abrir = (a: Acao, s: SalarioResumo) => {
    setSelecionado(s);
    setAcao(a);
    setErro("");
    setValor("");
    setForma(a === "pagar" ? "PIX" : "DINHEIRO");
    setSaiDoCaixa(null);
    if (a === "extrato") carregarExtrato(s.idFuncionario, 0);
  };

  const carregarExtrato = async (idFuncionario: number, pagina: number) => {
    setCarregandoExtrato(true);
    setErroExtrato("");
    try {
      const [e, h] = await Promise.all([
        pagina === 0 ? salarioService.extrato(idFuncionario) : Promise.resolve(null),
        salarioService.pagamentos(idFuncionario, pagina),
      ]);
      if (e) setExtrato(e);
      setHistorico(h);
    } catch {
      setErroExtrato("Não foi possível carregar o extrato.");
    } finally {
      setCarregandoExtrato(false);
    }
  };

  const confirmar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selecionado) return;
    setErro("");
    if (acao === "adiantamento") {
      const v = lerValor(valor);
      if (v === null || v <= 0) {
        setErro("Informe um valor maior que zero.");
        return;
      }
      if (v > selecionado.aReceber) {
        setErro(
          `O adiantamento não pode passar do salário a receber (${reais(selecionado.aReceber)}).`,
        );
        return;
      }
      setSalvando(true);
      try {
        await salarioService.adiantar(selecionado.idFuncionario, v, forma);
        toast.success(`Adiantamento de ${reais(v)} registrado.`);
        fechar();
        lista.recarregar();
      } catch (err) {
        setErro(mensagemDaApi(err) || "Não foi possível salvar. Tente novamente.");
      } finally {
        setSalvando(false);
      }
    } else if (acao === "pagar") {
      if (saiDoCaixa === null) {
        setErro("Responda se o salário saiu do caixa aberto.");
        return;
      }
      setSalvando(true);
      try {
        const p = await salarioService.pagar(selecionado.idFuncionario, forma, saiDoCaixa);
        toast.success(`Salário de ${reais(p.valorPago)} pago para ${p.nome}.`);
        fechar();
        lista.recarregar();
      } catch (err) {
        setErro(mensagemDaApi(err) || "Não foi possível salvar. Tente novamente.");
      } finally {
        setSalvando(false);
      }
    }
  };

  const titulos: Record<Acao, string> = {
    extrato: "Extrato",
    adiantamento: "Adiantamento",
    pagar: "Pagar salário",
  };

  const totalAReceber = lista.dados.reduce((t, s) => t + Math.max(0, s.aReceber), 0);

  return (
    <Layout>
      <PageHeader
        titulo="Salários"
        descricao="Comissão dos profissionais pelos atendimentos fechados desde o último pagamento, menos os adiantamentos."
      />

      {lista.carregando && <Carregando ativo contexto="Calculando os salários..." />}
      {!lista.carregando && lista.erro && (
        <ErrorState mensagem={lista.erro.mensagem} onTentarNovamente={lista.recarregar} />
      )}
      {!lista.carregando && !lista.erro && lista.dados.length === 0 && (
        <EmptyState
          titulo="Nenhum profissional cadastrado"
          texto="Cadastre os profissionais da loja para calcular os salários."
        />
      )}

      {!lista.carregando && !lista.erro && lista.dados.length > 0 && (
        <Card como="section" className="financeiro-secao">
          <p className="texto-ajuda">
            Total a receber: <strong data-cy="salarios-total">{reais(totalAReceber)}</strong>
          </p>
          <div className="tabela-container">
            <table className="tabela-SaaS" data-cy="salarios-lista">
              <thead>
                <tr>
                  <th scope="col">Profissional</th>
                  <th scope="col" className="tabela__num">
                    Comissão no período
                  </th>
                  <th scope="col" className="tabela__num">
                    Adiantamentos
                  </th>
                  <th scope="col" className="tabela__num">
                    A receber
                  </th>
                  <th scope="col">Último pagamento</th>
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {lista.dados.map((s) => (
                  <tr key={s.idFuncionario} data-cy="salario-linha">
                    <td>{s.nome}</td>
                    <td className="tabela__num">{reais(s.comissao)}</td>
                    <td className="tabela__num">{reais(s.adiantamentosPendentes)}</td>
                    <td className="tabela__num" data-cy="salario-a-receber">
                      <strong>{reais(s.aReceber)}</strong>
                    </td>
                    <td>{s.ultimoPagamento ? data(s.ultimoPagamento) : "Nunca"}</td>
                    <td>
                      <div className="salario-acoes">
                        <Button
                          variante="fantasma"
                          onClick={() => abrir("extrato", s)}
                          data-cy="salario-ver-extrato"
                        >
                          Ver extrato
                        </Button>
                        {pode && (
                          <>
                            <Button
                              variante="secundario"
                              onClick={() => abrir("adiantamento", s)}
                              disabled={s.aReceber <= 0}
                              data-cy="salario-adiantamento"
                            >
                              Adiantamento
                            </Button>
                            <Button
                              onClick={() => abrir("pagar", s)}
                              disabled={s.aReceber <= 0}
                              data-cy="salario-pagar"
                            >
                              Pagar salário
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Extrato (RO-03) e histórico de pagamentos */}
      <Modal
        titulo={selecionado ? `Extrato — ${selecionado.nome}` : "Extrato"}
        aberto={acao === "extrato"}
        onFechar={fechar}
        data-cy="modal-extrato"
        rodape={
          <Button variante="secundario" onClick={fechar}>
            Fechar
          </Button>
        }
      >
        {carregandoExtrato && !extrato && <Carregando ativo contexto="Carregando o extrato..." />}
        {erroExtrato && (
          <div className="alerta alerta-erro" role="alert">
            {erroExtrato}
          </div>
        )}
        {extrato && selecionado && extrato.idFuncionario === selecionado.idFuncionario && (
          <div className="salario-extrato">
            <p className="texto-ajuda">
              {extrato.ultimoPagamento
                ? `Desde o último pagamento (${dataHora(extrato.ultimoPagamento)}).`
                : "Ainda não recebeu salário: todos os atendimentos."}
              {extrato.periodoLimitado && " Mostrando só o último ano."}
            </p>
            <dl className="salario-totais" data-cy="extrato-totais">
              <div>
                <dt>Comissão</dt>
                <dd>{reais(extrato.comissao)}</dd>
              </div>
              <div>
                <dt>Adiantamentos</dt>
                <dd>− {reais(extrato.totalAdiantamentos)}</dd>
              </div>
              <div>
                <dt>A receber</dt>
                <dd data-cy="extrato-a-receber">
                  <strong>{reais(extrato.aReceber)}</strong>
                </dd>
              </div>
            </dl>

            <h3 className="financeiro-secao__titulo">Atendimentos</h3>
            {extrato.itens.length === 0 ? (
              <p className="texto-ajuda">Nenhum atendimento no período.</p>
            ) : (
              <div className="tabela-container">
                <table className="tabela-SaaS" data-cy="extrato-itens">
                  <thead>
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Comanda</th>
                      <th scope="col">Cliente</th>
                      <th scope="col">Serviço</th>
                      <th scope="col" className="tabela__num">
                        Valor
                      </th>
                      <th scope="col" className="tabela__num">
                        % loja
                      </th>
                      <th scope="col" className="tabela__num">
                        Parte do profissional
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {extrato.itens.map((i, n) => (
                      <tr key={`${i.idComanda}-${n}`}>
                        <td>{dataHora(i.data)}</td>
                        <td>#{i.idComanda}</td>
                        <td>{i.cliente || "—"}</td>
                        <td>{i.servico}</td>
                        <td className="tabela__num">{reais(i.valor)}</td>
                        <td className="tabela__num">{i.comissaoLoja}%</td>
                        <td className="tabela__num">{reais(i.parteProfissional)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" colSpan={4}>
                        Total
                      </th>
                      <td className="tabela__num">{reais(extrato.valorItens)}</td>
                      <td />
                      <td className="tabela__num">{reais(extrato.parteItens)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <h3 className="financeiro-secao__titulo">Adiantamentos a descontar</h3>
            {extrato.adiantamentosPendentes.length === 0 ? (
              <p className="texto-ajuda">Nenhum.</p>
            ) : (
              <ul className="financeiro-movimentos" data-cy="extrato-adiantamentos">
                {extrato.adiantamentosPendentes.map((a) => (
                  <li key={a.id}>
                    <span>{dataHora(a.data)}</span>
                    <span>{descricaoForma(a.forma)}</span>
                    <strong className="financeiro-saida">{reais(a.valor)}</strong>
                  </li>
                ))}
              </ul>
            )}

            <h3 className="financeiro-secao__titulo">Pagamentos anteriores</h3>
            {!historico || historico.itens.length === 0 ? (
              <p className="texto-ajuda">Nenhum pagamento ainda.</p>
            ) : (
              <>
                <div className="tabela-container">
                  <table className="tabela-SaaS" data-cy="extrato-pagamentos">
                    <thead>
                      <tr>
                        <th scope="col">Pago em</th>
                        <th scope="col">Forma</th>
                        <th scope="col" className="tabela__num">
                          Comissão
                        </th>
                        <th scope="col" className="tabela__num">
                          Adiantamentos
                        </th>
                        <th scope="col" className="tabela__num">
                          Pago
                        </th>
                        <th scope="col">Caixa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historico.itens.map((p) => (
                        <tr key={p.id}>
                          <td>{dataHora(p.pagoEm)}</td>
                          <td>{descricaoForma(p.forma)}</td>
                          <td className="tabela__num">{reais(p.valorComissao)}</td>
                          <td className="tabela__num">{reais(p.adiantamentosDescontados)}</td>
                          <td className="tabela__num">
                            <strong>{reais(p.valorPago)}</strong>
                          </td>
                          <td>
                            {p.saiuDoCaixa ? (
                              <Badge tom="marca">Saiu do caixa</Badge>
                            ) : (
                              <Badge>Por fora</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Paginacao
                  rotulo="Pagamentos de salário"
                  pagina={historico.pagina + 1}
                  totalPaginas={historico.totalPaginas}
                  totalItens={historico.total}
                  porPagina={historico.tamanho}
                  onMudar={(p) => carregarExtrato(extrato.idFuncionario, p - 1)}
                  desabilitado={carregandoExtrato}
                />
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Adiantamento (RO-08) e pagamento (RO-01, RO-02) */}
      <Modal
        titulo={
          selecionado && acao && acao !== "extrato" ? `${titulos[acao]} — ${selecionado.nome}` : ""
        }
        aberto={acao === "adiantamento" || acao === "pagar"}
        onFechar={fechar}
        data-cy="modal-salario"
        rodape={
          <>
            <Button variante="secundario" onClick={fechar}>
              Voltar
            </Button>
            <Button
              type="submit"
              form="form-salario"
              carregando={salvando}
              textoCarregando="Salvando..."
              data-cy="salario-confirmar"
            >
              {acao === "pagar" ? "Pagar" : "Registrar adiantamento"}
            </Button>
          </>
        }
      >
        {selecionado && (
          <form id="form-salario" onSubmit={confirmar} noValidate className="financeiro-form">
            {erro && (
              <div className="alerta alerta-erro" role="alert" data-cy="salario-erro">
                {erro}
              </div>
            )}
            {acao === "adiantamento" && (
              <>
                <p className="texto-ajuda" data-cy="adiantamento-maximo">
                  Máximo: {reais(selecionado.aReceber)} (salário a receber). Sai do caixa aberto.
                </p>
                <div className="campo-wrapper">
                  <label htmlFor="salario-valor">Valor</label>
                  <input
                    id="salario-valor"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    required
                    data-cy="salario-valor"
                  />
                </div>
              </>
            )}
            {acao === "pagar" && (
              <>
                <dl className="salario-totais">
                  <div>
                    <dt>Comissão</dt>
                    <dd>{reais(selecionado.comissao)}</dd>
                  </div>
                  <div>
                    <dt>Adiantamentos</dt>
                    <dd>− {reais(selecionado.adiantamentosPendentes)}</dd>
                  </div>
                  <div>
                    <dt>Valor a pagar</dt>
                    <dd data-cy="pagar-valor">
                      <strong>{reais(selecionado.aReceber)}</strong>
                    </dd>
                  </div>
                </dl>
              </>
            )}
            <div className="campo-wrapper">
              <label htmlFor="salario-forma">Forma de pagamento</label>
              <select
                id="salario-forma"
                value={forma}
                onChange={(e) => setForma(e.target.value as FormaPagamento)}
                data-cy="salario-forma"
              >
                {FORMAS_PAGAMENTO.map((f) => (
                  <option key={f.forma} value={f.forma}>
                    {f.descricao}
                  </option>
                ))}
              </select>
            </div>
            {acao === "pagar" && (
              <fieldset className="salario-pergunta" data-cy="pagar-saiu-do-caixa">
                <legend>Saiu do caixa aberto?</legend>
                <label>
                  <input
                    type="radio"
                    name="sai-do-caixa"
                    checked={saiDoCaixa === true}
                    onChange={() => setSaiDoCaixa(true)}
                    data-cy="pagar-caixa-sim"
                  />{" "}
                  Sim, sai do caixa
                </label>
                <label>
                  <input
                    type="radio"
                    name="sai-do-caixa"
                    checked={saiDoCaixa === false}
                    onChange={() => setSaiDoCaixa(false)}
                    data-cy="pagar-caixa-nao"
                  />{" "}
                  Não, foi pago por fora (ex.: conta da loja)
                </label>
              </fieldset>
            )}
          </form>
        )}
      </Modal>
    </Layout>
  );
}
