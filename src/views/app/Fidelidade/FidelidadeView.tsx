// @requisito RO-27 RND-05
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Link } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import {
  Badge,
  Button,
  Card,
  Carregando,
  EmptyState,
  ErrorState,
  FormField,
  PageHeader,
} from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { temPermissao } from "@/lib/permissoes";
import {
  fidelidadeService,
  MAX_VISITAS,
  MIN_VISITAS,
  type ConfigFidelidade,
  type MarcoFidelidade,
} from "@/services/fidelidade";
import { periodoDoMes } from "./fidelidadeUtil";
import "./Fidelidade.css";

const mesAtual = () => new Date().toLocaleDateString("sv-SE").slice(0, 7);

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const mensagemDaApi = (err: unknown) => {
  const dados = isAxiosError(err) ? err.response?.data : undefined;
  return typeof dados === "string" && dados.length < 200 ? dados : "";
};

/** Programa de fidelidade: a cada N visitas o cliente ganha a recompensa. Lista quem completou no mês. */
export default function FidelidadeView() {
  const config = useCarregar<ConfigFidelidade | null>(() => fidelidadeService.config(), null);
  const [mes, setMes] = useState(mesAtual());
  const marcos = useCarregar<MarcoFidelidade[]>(() => {
    const { de, ate } = periodoDoMes(mes);
    return fidelidadeService.marcos(de, ate);
  }, []);

  const [ativo, setAtivo] = useState(false);
  const [visitas, setVisitas] = useState("10");
  const [recompensa, setRecompensa] = useState("");
  const [enviarEmail, setEnviarEmail] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const podeEditar = temPermissao("LOJA_EDITAR");

  useEffect(() => {
    if (!config.dados) return;
    setAtivo(config.dados.ativo);
    setVisitas(String(config.dados.visitasParaRecompensa));
    setRecompensa(config.dados.recompensa ?? "");
    setEnviarEmail(config.dados.enviarEmail);
  }, [config.dados]);

  // Troca de mês: recarrega (a primeira carga já é feita pelo useCarregar).
  const recarregarMarcos = marcos.recarregar;
  const mesCarregado = useRef(mes);
  useEffect(() => {
    if (mesCarregado.current === mes) return;
    mesCarregado.current = mes;
    recarregarMarcos();
  }, [mes, recarregarMarcos]);

  const salvar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const n = Number(visitas);
    if (!Number.isInteger(n) || n < MIN_VISITAS || n > MAX_VISITAS) {
      setErro(`O número de visitas deve ficar entre ${MIN_VISITAS} e ${MAX_VISITAS}.`);
      return;
    }
    if (ativo && !recompensa.trim()) {
      setErro("Informe a recompensa (ex.: 1 corte grátis).");
      return;
    }
    setErro("");
    setSalvando(true);
    try {
      const salvo = await fidelidadeService.salvar({
        ativo,
        visitasParaRecompensa: n,
        recompensa: recompensa.trim() || null,
        enviarEmail,
      });
      config.setDados(salvo);
      toast.success("Fidelidade salva.");
    } catch (err) {
      setErro(mensagemDaApi(err) || "Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Fidelidade"
        descricao="A cada N visitas (atendimentos fechados) o cliente ganha uma recompensa."
      />

      {config.carregando && <Carregando ativo contexto="Carregando a fidelidade..." />}
      {!config.carregando && config.erro && (
        <ErrorState mensagem={config.erro.mensagem} onTentarNovamente={config.recarregar} />
      )}

      {!config.carregando && !config.erro && (
        <Card como="section" className="form-card">
          <h2 className="fidelidade-titulo">Programa</h2>
          <form onSubmit={salvar} noValidate data-cy="form-fidelidade">
            <div className="opcao-inline-linha">
              <label className="opcao-inline">
                <input
                  id="fidelidade-ativo"
                  type="checkbox"
                  checked={ativo}
                  disabled={!podeEditar}
                  onChange={(e) => setAtivo(e.target.checked)}
                  data-cy="fidelidade-ativo"
                />
                Programa ativo
              </label>
            </div>
            <div className="form-grade">
              <FormField
                id="fidelidade-visitas"
                label="Visitas para ganhar"
                obrigatorio
                colunas={4}
                ajuda={`De ${MIN_VISITAS} a ${MAX_VISITAS}.`}
              >
                <input
                  type="number"
                  min={MIN_VISITAS}
                  max={MAX_VISITAS}
                  step={1}
                  value={visitas}
                  disabled={!podeEditar}
                  onChange={(e) => setVisitas(e.target.value)}
                  data-cy="fidelidade-visitas"
                />
              </FormField>
              <FormField
                id="fidelidade-recompensa"
                label="Recompensa"
                obrigatorio={ativo}
                colunas={8}
                ajuda="Ex.: 1 corte grátis"
              >
                <input
                  type="text"
                  maxLength={100}
                  value={recompensa}
                  disabled={!podeEditar}
                  onChange={(e) => setRecompensa(e.target.value)}
                  data-cy="fidelidade-recompensa"
                />
              </FormField>
            </div>
            <div className="opcao-inline-linha">
              <label className="opcao-inline">
                <input
                  id="fidelidade-email"
                  type="checkbox"
                  checked={enviarEmail}
                  disabled={!podeEditar}
                  onChange={(e) => setEnviarEmail(e.target.checked)}
                  data-cy="fidelidade-email"
                />
                Enviar e-mail de parabéns ao cliente (se ele tiver e-mail)
              </label>
            </div>
            {erro && (
              <div className="alerta alerta-erro" role="alert" data-cy="fidelidade-erro">
                {erro}
              </div>
            )}
            {podeEditar && (
              <div className="form-rodape">
                <Button
                  type="submit"
                  carregando={salvando}
                  textoCarregando="Salvando..."
                  data-cy="fidelidade-salvar"
                >
                  Salvar
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      <Card como="section" className="fidelidade-secao">
        <div className="fidelidade-secao__topo">
          <h2 className="fidelidade-titulo">Recompensas conquistadas</h2>
          <div className="fidelidade-filtro">
            <label htmlFor="fidelidade-mes">Mês</label>
            <input
              id="fidelidade-mes"
              type="month"
              value={mes}
              onChange={(e) => e.target.value && setMes(e.target.value)}
              data-cy="fidelidade-mes"
            />
          </div>
        </div>
        {marcos.carregando && <Carregando ativo contexto="Carregando as recompensas..." />}
        {!marcos.carregando && marcos.erro && (
          <ErrorState mensagem={marcos.erro.mensagem} onTentarNovamente={marcos.recarregar} />
        )}
        {!marcos.carregando && !marcos.erro && marcos.dados.length === 0 && (
          <EmptyState
            titulo="Ninguém completou o ciclo neste mês"
            texto="Quando um cliente completar as visitas, ele aparece aqui para você dar a recompensa."
          />
        )}
        {!marcos.carregando && !marcos.erro && marcos.dados.length > 0 && (
          <div className="tabela-container">
            <table className="tabela-SaaS" data-cy="fidelidade-marcos">
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Cliente</th>
                  <th scope="col" className="tabela__num">
                    Visitas
                  </th>
                  <th scope="col">Recompensa</th>
                  <th scope="col">E-mail</th>
                </tr>
              </thead>
              <tbody>
                {marcos.dados.map((m) => (
                  <tr key={m.id} data-cy={`marco-${m.clienteId}`}>
                    <td>{dataHora(m.criadoEm)}</td>
                    <td>
                      <Link
                        to="/cliente-historico"
                        search={{ id: m.clienteId }}
                        className="link"
                        data-cy={`marco-historico-${m.clienteId}`}
                      >
                        {m.cliente}
                      </Link>
                    </td>
                    <td className="tabela__num">{m.visitas}</td>
                    <td>{m.recompensa || "—"}</td>
                    <td>
                      {m.emailEnviado ? (
                        <Badge tom="marca">Enviado</Badge>
                      ) : (
                        <Badge>{m.email ? "Não enviado" : "Sem e-mail"}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Layout>
  );
}
