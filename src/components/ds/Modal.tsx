import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

const SELETOR_FOCAVEL =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface ModalProps {
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  rodape?: React.ReactNode;
  children: React.ReactNode;
  "data-cy"?: string;
}

/**
 * Diálogo acessível: foco inicial no primeiro campo, Tab preso dentro,
 * Esc e clique fora fecham, e o foco volta para quem abriu.
 */
export function Modal({ titulo, aberto, onFechar, rodape, children, ...resto }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const idTitulo = useId();
  const onFecharRef = useRef(onFechar);
  onFecharRef.current = onFechar;

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const dialogo = ref.current;
    const focaveis = () =>
      Array.from(dialogo?.querySelectorAll<HTMLElement>(SELETOR_FOCAVEL) ?? []);
    // Pula o botão "fechar" do cabeçalho no foco inicial.
    (focaveis().find((el) => !el.dataset.fechar) ?? focaveis()[0])?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onFecharRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const lista = focaveis();
      if (lista.length === 0) return;
      const primeiro = lista[0];
      const ultimo = lista[lista.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div
      className="modal-fundo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        {...resto}
      >
        <div className="modal__cabecalho">
          <h2 id={idTitulo} className="modal__titulo">
            {titulo}
          </h2>
          <button
            type="button"
            className="btn btn-fantasma btn-icone"
            onClick={onFechar}
            aria-label="Fechar"
            data-fechar="true"
          >
            <X size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
        <div className="modal__corpo">{children}</div>
        {rodape && <div className="modal__rodape">{rodape}</div>}
      </div>
    </div>
  );
}

export default Modal;
