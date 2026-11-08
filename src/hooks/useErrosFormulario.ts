import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * Erros de validação exibidos junto ao campo (FormField `erro`), com o mesmo
 * aviso em toast e foco levado ao campo com problema.
 * O id do campo segue o padrão `campo-<nome>`.
 */
export function useErrosFormulario<C extends string = string>() {
  const [erros, setErros] = useState<Partial<Record<C, string>>>({});

  const falhar = useCallback((campo: C, mensagem: string) => {
    setErros({ [campo]: mensagem } as Partial<Record<C, string>>);
    toast.warning(mensagem);
    requestAnimationFrame(() => document.getElementById(`campo-${campo}`)?.focus());
  }, []);

  const limpar = useCallback((campo?: C) => {
    setErros((atual) => {
      if (!campo) return {};
      if (!atual[campo]) return atual;
      const proximo = { ...atual };
      delete proximo[campo];
      return proximo;
    });
  }, []);

  return { erros, falhar, limpar };
}

export default useErrosFormulario;
