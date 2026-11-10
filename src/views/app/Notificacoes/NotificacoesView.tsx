// @requisito RO-43
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCheck } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button, Card, Carregando, EmptyState, ErrorState, PageHeader } from "@/components/ds";
import { classificarErro, type ErroCarregamento } from "@/hooks/useCarregar";
import {
  avisarQueAvisosMudaram,
  notificacoesService,
  quandoFoi,
  type Notificacao,
} from "@/services/notificacoes";
import "./Notificacoes.css";

const POR_PAGINA = 20;

type Filtro = "todas" | "nao-lidas";

/** Todos os avisos do usuário nesta loja, com "Carregar mais" e filtro Todas / Não lidas. */
export default function NotificacoesView() {
  const navigate = useNavigate();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState<ErroCarregamento | null>(null);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  /** Ignora respostas antigas quando o filtro muda no meio de uma consulta. */
  const consultaAtual = useRef(0);

  const carregar = useCallback((f: Filtro, p: number) => {
    const consulta = ++consultaAtual.current;
    if (p === 0) setCarregando(true);
    else setCarregandoMais(true);
    setErro(null);
    notificacoesService
      .listar({ pagina: p, tamanho: POR_PAGINA, naoLidas: f === "nao-lidas" })
      .then((r) => {
        if (consulta !== consultaAtual.current) return;
        setItens((atuais) => (p === 0 ? r.itens : [...atuais, ...r.itens]));
        setPagina(p);
        setTemMais(r.temMais);
      })
      .catch((e) => {
        if (consulta === consultaAtual.current) setErro(classificarErro(e));
      })
      .finally(() => {
        if (consulta !== consultaAtual.current) return;
        setCarregando(false);
        setCarregandoMais(false);
      });
  }, []);

  useEffect(() => {
    carregar(filtro, 0);
  }, [filtro, carregar]);

  const abrir = (n: Notificacao) => {
    if (!n.lida) {
      setItens((atuais) => atuais.map((i) => (i.id === n.id ? { ...i, lida: true } : i)));
      notificacoesService
        .marcarLida(n.id)
        .then(avisarQueAvisosMudaram)
        .catch(() => {
          /* O interceptor já mostra o erro. */
        });
    }
    if (n.link) navigate({ href: n.link });
  };

  const marcarTodas = () => {
    setMarcandoTodas(true);
    notificacoesService
      .marcarTodasLidas()
      .then(() => {
        setItens((atuais) => atuais.map((i) => (i.lida ? i : { ...i, lida: true })));
        avisarQueAvisosMudaram();
      })
      .catch(() => {
        /* O interceptor já mostra o erro. */
      })
      .finally(() => setMarcandoTodas(false));
  };

  const temNaoLidas = itens.some((i) => !i.lida);

  return (
    <Layout>
      <PageHeader
        titulo="Avisos"
        descricao="Novidades da loja para você: agendamentos, fidelidade e caixa. Avisos com mais de 90 dias são apagados."
        acoes={
          <Button
            variante="secundario"
            icone={<CheckCheck size={16} strokeWidth={1.75} aria-hidden="true" />}
            onClick={marcarTodas}
            carregando={marcandoTodas}
            textoCarregando="Marcando…"
            disabled={!temNaoLidas}
            data-cy="notificacoes-marcar-todas"
          >
            Marcar todas como lidas
          </Button>
        }
      />

      <div className="notificacoes__filtro" role="group" aria-label="Mostrar">
        {(
          [
            ["todas", "Todas"],
            ["nao-lidas", "Não lidas"],
          ] as const
        ).map(([valor, rotulo]) => (
          <button
            key={valor}
            type="button"
            className="notificacoes__filtro-opcao"
            aria-pressed={filtro === valor}
            onClick={() => setFiltro(valor)}
            data-cy={`notificacoes-filtro-${valor}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {carregando && <Carregando ativo contexto="Carregando os avisos..." />}
      {!carregando && erro && itens.length === 0 && (
        <ErrorState mensagem={erro.mensagem} onTentarNovamente={() => carregar(filtro, 0)} />
      )}
      {!carregando && !erro && itens.length === 0 && (
        <EmptyState
          titulo="Nenhum aviso por aqui."
          texto={
            filtro === "nao-lidas"
              ? "Você já leu todos os avisos."
              : "Quando alguém agendar, cancelar ou o caixa precisar de atenção, aparece aqui."
          }
        />
      )}

      {!carregando && itens.length > 0 && (
        <Card semPadding>
          <ul className="notificacoes__lista" data-cy="notificacoes-lista">
            {itens.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`notificacoes__item ${n.lida ? "" : "notificacoes__item--nao-lido"}`.trim()}
                  onClick={() => abrir(n)}
                  data-cy="notificacao-item"
                >
                  {!n.lida && <span className="notificacoes__ponto" aria-hidden="true" />}
                  <span className="notificacoes__texto">
                    <span className="notificacoes__titulo">
                      {!n.lida && <span className="sr-only">Não lido: </span>}
                      {n.titulo}
                    </span>
                    <span className="notificacoes__mensagem">{n.mensagem}</span>
                    <time className="notificacoes__quando" dateTime={n.criadaEm}>
                      {quandoFoi(n.criadaEm)}
                    </time>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!carregando && erro && itens.length > 0 && (
        <p className="notificacoes__erro" role="alert">
          {erro.mensagem}
        </p>
      )}

      {!carregando && temMais && (
        <div className="notificacoes__mais">
          <Button
            variante="secundario"
            onClick={() => carregar(filtro, pagina + 1)}
            carregando={carregandoMais}
            textoCarregando="Carregando…"
            data-cy="notificacoes-carregar-mais"
          >
            Carregar mais
          </Button>
        </div>
      )}
    </Layout>
  );
}
