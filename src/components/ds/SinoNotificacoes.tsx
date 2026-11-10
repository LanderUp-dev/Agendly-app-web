// @requisito RO-43
import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, RotateCw } from "lucide-react";
import { obterLojaAtiva } from "@/lib/auth";
import {
  descricaoSino,
  EVENTO_AVISOS_MUDARAM,
  notificacoesService,
  quandoFoi,
  rotuloContagem,
  type Notificacao,
} from "@/services/notificacoes";
import { Spinner } from "./Spinner";
import "./SinoNotificacoes.css";

/** Intervalo do polling da contagem (só com a aba visível). */
const INTERVALO_MS = 60_000;
/** Foco + visibilitychange chegam juntos: evita duas consultas seguidas. */
const INTERVALO_MINIMO_MS = 5_000;
const ITENS_NO_PAINEL = 10;

type EstadoPainel = "carregando" | "pronto" | "erro";

/**
 * Sininho de avisos da barra do app. Sem props: lê a loja ativa e só consulta a API com loja.
 * A contagem é atualizada a cada 60 s enquanto a aba está visível e ao focar a janela.
 */
export function SinoNotificacoes() {
  const navigate = useNavigate();
  const lojaId = obterLojaAtiva()?.lojaId ?? null;
  const idPainel = useId();
  const idTitulo = useId();

  const [contagem, setContagem] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [estado, setEstado] = useState<EstadoPainel>("carregando");
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const raizRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);
  const ultimaConsulta = useRef(0);
  const consultando = useRef(false);

  const atualizarContagem = useCallback(
    (forcar = false) => {
      if (lojaId == null || consultando.current) return;
      const agora = Date.now();
      if (!forcar && agora - ultimaConsulta.current < INTERVALO_MINIMO_MS) return;
      ultimaConsulta.current = agora;
      consultando.current = true;
      notificacoesService
        .contarNaoLidas()
        .then(setContagem)
        .catch(() => {
          /* Falha silenciosa: mantém o último número; o painel mostra o erro se for aberto. */
        })
        .finally(() => {
          consultando.current = false;
        });
    },
    [lojaId],
  );

  // Polling: só com loja e com a aba visível; reconsulta ao voltar para a aba ou focar a janela.
  useEffect(() => {
    if (lojaId == null) {
      setContagem(0);
      return;
    }
    let timer: number | undefined;
    const parar = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };
    const iniciar = () => {
      parar();
      if (document.visibilityState === "visible") {
        timer = window.setInterval(() => atualizarContagem(true), INTERVALO_MS);
      }
    };
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") {
        atualizarContagem();
        iniciar();
      } else {
        parar();
      }
    };
    const aoFocar = () => atualizarContagem();
    const aoMudarAvisos = () => atualizarContagem(true);

    atualizarContagem(true);
    iniciar();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener("focus", aoFocar);
    window.addEventListener(EVENTO_AVISOS_MUDARAM, aoMudarAvisos);
    return () => {
      parar();
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("focus", aoFocar);
      window.removeEventListener(EVENTO_AVISOS_MUDARAM, aoMudarAvisos);
    };
  }, [lojaId, atualizarContagem]);

  const carregarPainel = useCallback(() => {
    setEstado("carregando");
    notificacoesService
      .listar({ tamanho: ITENS_NO_PAINEL })
      .then((pagina) => {
        setItens(pagina.itens);
        setEstado("pronto");
      })
      .catch(() => setEstado("erro"));
    atualizarContagem(true);
  }, [atualizarContagem]);

  const fechar = useCallback((devolverFoco: boolean) => {
    setAberto(false);
    if (devolverFoco) botaoRef.current?.focus();
  }, []);

  // Esc fecha (foco volta ao botão); clique fora fecha.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        fechar(true);
      }
    };
    const aoClicar = (e: MouseEvent) => {
      if (raizRef.current && !raizRef.current.contains(e.target as Node)) fechar(false);
    };
    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicar);
    painelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicar);
    };
  }, [aberto, fechar]);

  const alternar = () => {
    if (aberto) {
      fechar(false);
      return;
    }
    setAberto(true);
    carregarPainel();
  };

  const abrirAviso = (n: Notificacao) => {
    if (!n.lida) {
      // Otimista: destaca como lido na hora; se falhar, a próxima consulta corrige.
      setItens((atuais) => atuais.map((i) => (i.id === n.id ? { ...i, lida: true } : i)));
      setContagem((c) => Math.max(0, c - 1));
      notificacoesService.marcarLida(n.id).catch(() => atualizarContagem(true));
    }
    if (n.link) {
      fechar(false);
      navigate({ href: n.link });
    }
  };

  const marcarTodas = () => {
    setMarcandoTodas(true);
    notificacoesService
      .marcarTodasLidas()
      .then(() => {
        setItens((atuais) => atuais.map((i) => (i.lida ? i : { ...i, lida: true })));
        setContagem(0);
      })
      .catch(() => {
        /* O interceptor já mostra o erro. */
      })
      .finally(() => setMarcandoTodas(false));
  };

  if (lojaId == null) return null;

  const rotulo = rotuloContagem(contagem);
  const temNaoLidas = itens.some((i) => !i.lida) || contagem > 0;

  return (
    <div className="sino" ref={raizRef}>
      <button
        ref={botaoRef}
        type="button"
        className="btn btn-fantasma btn-icone sino__botao"
        aria-label={descricaoSino(contagem)}
        aria-expanded={aberto}
        aria-controls={aberto ? idPainel : undefined}
        aria-haspopup="dialog"
        onClick={alternar}
        data-cy="sino"
      >
        <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
        {rotulo && (
          <span className="sino__contagem" aria-hidden="true" data-cy="sino-contagem">
            {rotulo}
          </span>
        )}
      </button>

      {aberto && (
        <div
          id={idPainel}
          ref={painelRef}
          className="sino__painel"
          role="dialog"
          aria-labelledby={idTitulo}
          tabIndex={-1}
          data-cy="sino-painel"
        >
          <div className="sino__cabecalho">
            <h2 id={idTitulo} className="sino__titulo">
              Avisos
            </h2>
            {estado === "pronto" && temNaoLidas && (
              <button
                type="button"
                className="sino__acao"
                onClick={marcarTodas}
                disabled={marcandoTodas}
                aria-busy={marcandoTodas}
                data-cy="sino-marcar-todas"
              >
                <CheckCheck size={16} strokeWidth={1.75} aria-hidden="true" />
                {marcandoTodas ? "Marcando…" : "Marcar todas como lidas"}
              </button>
            )}
          </div>

          <div className="sino__corpo" aria-live="polite" aria-busy={estado === "carregando"}>
            {estado === "carregando" && (
              <div className="sino__estado">
                <Spinner tamanho="sm" rotulo="" />
                <span>Carregando avisos…</span>
              </div>
            )}
            {estado === "erro" && (
              <div className="sino__estado sino__estado--erro" role="alert">
                <span>Não foi possível carregar os avisos.</span>
                <button type="button" className="sino__acao" onClick={carregarPainel}>
                  <RotateCw size={16} strokeWidth={1.75} aria-hidden="true" />
                  Tentar novamente
                </button>
              </div>
            )}
            {estado === "pronto" && itens.length === 0 && (
              <p className="sino__estado" data-cy="sino-vazio">
                Nenhum aviso por aqui.
              </p>
            )}
            {estado === "pronto" && itens.length > 0 && (
              <ul className="sino__lista">
                {itens.map((n) => (
                  <li key={n.id}>
                    <ItemAviso aviso={n} onAbrir={abrirAviso} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sino__rodape">
            <Link
              to="/notificacoes"
              className="sino__ver-todas"
              onClick={() => fechar(false)}
              data-cy="sino-ver-todas"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

interface ItemAvisoProps {
  aviso: Notificacao;
  onAbrir: (n: Notificacao) => void;
}

/** Item com link = <a> (abre em nova aba com o botão do meio); sem link = <button>. */
function ItemAviso({ aviso, onAbrir }: ItemAvisoProps) {
  const classe = `sino__item ${aviso.lida ? "" : "sino__item--nao-lido"}`.trim();
  const conteudo = (
    <>
      {!aviso.lida && <span className="sino__ponto" aria-hidden="true" />}
      <span className="sino__texto">
        <span className="sino__item-titulo">
          {!aviso.lida && <span className="sr-only">Não lido: </span>}
          {aviso.titulo}
        </span>
        <span className="sino__item-mensagem">{aviso.mensagem}</span>
        <time className="sino__item-quando" dateTime={aviso.criadaEm}>
          {quandoFoi(aviso.criadaEm)}
        </time>
      </span>
    </>
  );
  if (aviso.link) {
    return (
      <a
        href={aviso.link}
        className={classe}
        data-cy="sino-item"
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          onAbrir(aviso);
        }}
      >
        {conteudo}
      </a>
    );
  }
  return (
    <button type="button" className={classe} data-cy="sino-item" onClick={() => onAbrir(aviso)}>
      {conteudo}
    </button>
  );
}

export default SinoNotificacoes;
