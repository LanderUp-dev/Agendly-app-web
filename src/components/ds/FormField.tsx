import React from "react";
import { Spinner } from "./Spinner";

/**
 * Campo de formulário: rótulo sempre visível + controle + ajuda + erro.
 * Liga automaticamente id, aria-describedby, aria-invalid e required no filho.
 *
 *   <FormField id="campo-nome" label="Nome" obrigatorio erro={erros.nome}>
 *     <input name="nome" ... />
 *   </FormField>
 */
export interface FormFieldProps {
  id: string;
  label: string;
  obrigatorio?: boolean;
  ajuda?: React.ReactNode;
  erro?: string | null;
  /** Mostra spinner no controle (ex.: select esperando a lista). */
  carregando?: boolean;
  /** Colunas na grade de 12 do formulário: 12 (padrão), 8, 6, 4 ou 3. */
  colunas?: 12 | 8 | 6 | 4 | 3 | 2;
  className?: string;
  children: React.ReactElement<Record<string, unknown>>;
}

export function FormField({
  id,
  label,
  obrigatorio,
  ajuda,
  erro,
  carregando,
  colunas = 12,
  className = "",
  children,
}: FormFieldProps) {
  const idAjuda = ajuda ? `${id}-ajuda` : undefined;
  const idErro = erro ? `${id}-erro` : undefined;
  const descritores = [idErro, idAjuda].filter(Boolean).join(" ") || undefined;

  const controle = React.cloneElement(children, {
    id,
    required: obrigatorio || undefined,
    "aria-describedby": descritores,
    "aria-invalid": erro ? true : undefined,
    "aria-busy": carregando || undefined,
  });

  const classe = [
    "campo-wrapper",
    colunas !== 12 ? `c-${colunas}` : "",
    carregando ? "campo-carregando" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classe}>
      <label htmlFor={id}>{label}</label>
      {controle}
      {carregando && <Spinner tamanho="sm" rotulo="" />}
      {ajuda && !erro && (
        <span id={idAjuda} className="campo-ajuda">
          {ajuda}
        </span>
      )}
      {erro && (
        <span id={idErro} className="campo-erro" role="alert">
          {erro}
        </span>
      )}
    </div>
  );
}

export default FormField;
