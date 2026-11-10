// @requisito RU-01 RO-32
import { useCallback, useEffect, useRef } from "react";
import type { AgendamentoAgenda } from "@/services/endpoints";
import {
  destinoDaPosicao,
  ehPassado,
  horaEmMinutos,
  minutosEmHora,
  podeMover,
  topoDoHorario,
  type Destino,
  type GeometriaGrade,
} from "./arrastarAgenda";

/** Distância (px) que o mouse anda antes de virar arraste (abaixo disso é clique). */
const LIMIAR_MOUSE = 5;
/** No toque, segurar parado este tempo inicia o arraste; mexer antes = rolar a grade. */
const ESPERA_TOQUE_MS = 350;
const LIMIAR_TOQUE = 8;
/** Faixa perto da borda da grade que rola sozinha durante o arraste. */
const BORDA_ROLAGEM = 48;

interface Opcoes {
  containerRef: React.RefObject<HTMLDivElement | null>;
  sombraRef: React.RefObject<HTMLDivElement | null>;
  profissionais: string[];
  /** Chave → nome (para o rótulo da sombra). */
  nomes?: ReadonlyMap<string, string>;
  passo: number;
  alturaLinha: number;
  /** yyyy-MM-dd do dia mostrado. */
  dataIso: string;
  habilitado: boolean;
  onMover?: (ag: AgendamentoAgenda, profissional: string, hora: string) => void;
}

interface Arraste {
  ag: AgendamentoAgenda;
  el: HTMLElement;
  pointerId: number;
  toque: boolean;
  inicioX: number;
  inicioY: number;
  x: number;
  y: number;
  pegaY: number;
  duracao: number;
  ativo: boolean;
  geo: GeometriaGrade | null;
  destino: Destino | null;
  valido: boolean;
  timer: number | null;
  raf: number | null;
}

/**
 * Arrastar e soltar com Pointer Events (mouse, caneta e toque), sem re-renderizar a grade:
 * tudo fica em refs, e a "sombra" do destino é movida direto no DOM a cada frame
 * (requestAnimationFrame). O React só fica sabendo no fim, por `onMover`.
 */
export function useArrastarAgendamento(opcoes: Opcoes) {
  const opRef = useRef(opcoes);
  opRef.current = opcoes;
  const arrasteRef = useRef<Arraste | null>(null);
  const ignorarCliqueRef = useRef(false);

  const medir = (): GeometriaGrade | null => {
    const grade = opRef.current.containerRef.current;
    if (!grade) return null;
    const cabecalhos = Array.from(grade.querySelectorAll<HTMLElement>("[data-cy=agenda-coluna]"));
    if (cabecalhos.length === 0) return null;
    return {
      colunas: cabecalhos.map((c) => ({ inicio: c.offsetLeft, largura: c.offsetWidth })),
      topoLinhas: cabecalhos[0].offsetHeight,
      alturaLinha: opRef.current.alturaLinha,
      passo: opRef.current.passo,
    };
  };

  const pintarSombra = (a: Arraste) => {
    const sombra = opRef.current.sombraRef.current;
    if (!sombra || !a.geo) return;
    if (!a.destino) {
      sombra.hidden = true;
      return;
    }
    const col = a.geo.colunas[a.destino.coluna];
    const hora = minutosEmHora(a.destino.minutos);
    const chave = opRef.current.profissionais[a.destino.coluna] ?? "";
    const prof = opRef.current.nomes?.get(chave) ?? chave;
    const top = topoDoHorario(a.destino.minutos, a.geo);
    sombra.hidden = false;
    sombra.style.transform = `translate(${col.inicio + 3}px, ${top}px)`;
    sombra.style.width = `${col.largura - 6}px`;
    sombra.style.height = `${Math.max((a.duracao / a.geo.passo) * a.geo.alturaLinha, 28) - 2}px`;
    sombra.dataset.invalido = a.valido ? "nao" : "sim";
    const rotulo = sombra.firstElementChild as HTMLElement | null;
    if (rotulo) {
      rotulo.textContent = a.valido ? `${hora} · ${prof}` : `${hora} · horário já passou`;
    }
  };

  const quadro = () => {
    const a = arrasteRef.current;
    const grade = opRef.current.containerRef.current;
    if (!a || !a.ativo || !grade) return;
    const r = grade.getBoundingClientRect();

    // Rolagem automática perto das bordas.
    if (a.y < r.top + BORDA_ROLAGEM)
      grade.scrollTop -= Math.ceil((r.top + BORDA_ROLAGEM - a.y) / 4);
    else if (a.y > r.bottom - BORDA_ROLAGEM)
      grade.scrollTop += Math.ceil((a.y - (r.bottom - BORDA_ROLAGEM)) / 4);
    if (a.x < r.left + BORDA_ROLAGEM)
      grade.scrollLeft -= Math.ceil((r.left + BORDA_ROLAGEM - a.x) / 4);
    else if (a.x > r.right - BORDA_ROLAGEM)
      grade.scrollLeft += Math.ceil((a.x - (r.right - BORDA_ROLAGEM)) / 4);

    if (a.geo) {
      const x = a.x - r.left + grade.scrollLeft;
      const y = a.y - a.pegaY - r.top + grade.scrollTop;
      const d = destinoDaPosicao(x, y, a.geo, a.duracao);
      const mudou =
        d?.coluna !== a.destino?.coluna || d?.minutos !== a.destino?.minutos || !d !== !a.destino;
      if (mudou) {
        a.destino = d;
        a.valido = !!d && !ehPassado(opRef.current.dataIso, minutosEmHora(d.minutos));
        pintarSombra(a);
      }
    }
    a.raf = requestAnimationFrame(quadro);
  };

  const ativar = (a: Arraste) => {
    a.ativo = true;
    a.geo = medir();
    a.el.classList.add("agenda-evento--arrastando");
    document.body.classList.add("agenda-arrastando");
    a.raf = requestAnimationFrame(quadro);
  };

  const encerrar = (soltou: boolean) => {
    const a = arrasteRef.current;
    if (!a) return;
    arrasteRef.current = null;
    if (a.timer != null) window.clearTimeout(a.timer);
    if (a.raf != null) cancelAnimationFrame(a.raf);
    window.removeEventListener("pointermove", aoMover);
    window.removeEventListener("pointerup", aoSoltar);
    window.removeEventListener("pointercancel", aoCancelar);
    window.removeEventListener("keydown", aoTecla, true);
    a.el.removeEventListener("touchmove", bloquearRolagem);
    a.el.removeEventListener("contextmenu", bloquearMenu);
    a.el.classList.remove("agenda-evento--arrastando");
    document.body.classList.remove("agenda-arrastando");
    const sombra = opRef.current.sombraRef.current;
    if (sombra) sombra.hidden = true;
    if (!a.ativo) return;

    // Depois de arrastar, o navegador ainda dispara "click" no bloco: ignora.
    ignorarCliqueRef.current = true;
    window.setTimeout(() => (ignorarCliqueRef.current = false), 0);

    if (!soltou || !a.destino || !a.valido) return;
    const prof = opRef.current.profissionais[a.destino.coluna];
    const hora = minutosEmHora(a.destino.minutos);
    if (!prof || (prof === a.ag.chaveProfissional && hora === a.ag.horaInicio)) return;
    opRef.current.onMover?.(a.ag, prof, hora);
  };

  // Funções estáveis (guardadas em ref) para poder remover os listeners.
  const aoMover = useStableHandler((e: PointerEvent) => {
    const a = arrasteRef.current;
    if (!a || e.pointerId !== a.pointerId) return;
    a.x = e.clientX;
    a.y = e.clientY;
    if (a.ativo) return; // o quadro (rAF) lê a posição
    const dist = Math.hypot(e.clientX - a.inicioX, e.clientY - a.inicioY);
    if (a.toque) {
      if (dist > LIMIAR_TOQUE) encerrar(false); // é rolagem, não arraste
    } else if (dist > LIMIAR_MOUSE) {
      ativar(a);
    }
  });
  const aoSoltar = useStableHandler((e: PointerEvent) => {
    if (arrasteRef.current && e.pointerId === arrasteRef.current.pointerId) encerrar(true);
  });
  const aoCancelar = useStableHandler(() => encerrar(false));
  const aoTecla = useStableHandler((e: KeyboardEvent) => {
    if (e.key === "Escape" && arrasteRef.current?.ativo) {
      e.preventDefault();
      e.stopPropagation();
      encerrar(false);
    }
  });
  const bloquearRolagem = useStableHandler((e: TouchEvent) => {
    if (arrasteRef.current?.ativo && e.cancelable) e.preventDefault();
  });
  const bloquearMenu = useStableHandler((e: Event) => {
    if (arrasteRef.current) e.preventDefault();
  });

  const iniciar = useCallback(
    (e: React.PointerEvent<HTMLElement>, ag: AgendamentoAgenda) => {
      const op = opRef.current;
      if (!op.habilitado || !op.onMover || !podeMover(ag.status)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (arrasteRef.current) encerrar(false);
      const el = e.currentTarget;
      const toque = e.pointerType === "touch";
      const a: Arraste = {
        ag,
        el,
        pointerId: e.pointerId,
        toque,
        inicioX: e.clientX,
        inicioY: e.clientY,
        x: e.clientX,
        y: e.clientY,
        pegaY: e.clientY - el.getBoundingClientRect().top,
        duracao: Math.max(horaEmMinutos(ag.horaFim) - horaEmMinutos(ag.horaInicio), op.passo),
        ativo: false,
        geo: null,
        destino: null,
        valido: false,
        timer: null,
        raf: null,
      };
      arrasteRef.current = a;
      window.addEventListener("pointermove", aoMover);
      window.addEventListener("pointerup", aoSoltar);
      window.addEventListener("pointercancel", aoCancelar);
      window.addEventListener("keydown", aoTecla, true);
      if (toque) {
        el.addEventListener("touchmove", bloquearRolagem, { passive: false });
        el.addEventListener("contextmenu", bloquearMenu);
        a.timer = window.setTimeout(() => {
          a.timer = null;
          if (arrasteRef.current === a) ativar(a);
        }, ESPERA_TOQUE_MS);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Desmontou no meio do arraste: limpa listeners e classes.
  useEffect(() => () => encerrar(false), []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Use no onClick do bloco: true quando o clique é o fim de um arraste. */
  const cliqueDoArraste = useCallback(() => ignorarCliqueRef.current, []);

  return { iniciar, cliqueDoArraste };
}

/** Função com identidade fixa que sempre chama a versão mais nova. */
function useStableHandler<A extends unknown[]>(fn: (...args: A) => void) {
  const ref = useRef(fn);
  ref.current = fn;
  const estavel = useRef((...args: A) => ref.current(...args));
  return estavel.current;
}
