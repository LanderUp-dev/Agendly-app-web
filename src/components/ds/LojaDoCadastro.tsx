import { Link } from "@tanstack/react-router";
import { FormField } from "./FormField";
import { obterLojaAtiva } from "@/lib/auth";

interface LojaDoCadastroProps {
  colunas?: 12 | 8 | 6 | 4 | 3 | 2;
}

/**
 * Mostra em qual loja o cadastro será salvo. O backend sempre usa a loja do
 * token (loja ativa); por isso o campo é só leitura, com atalho para trocar.
 */
export function LojaDoCadastro({ colunas = 6 }: LojaDoCadastroProps) {
  const loja = obterLojaAtiva();
  return (
    <FormField
      id="campo-loja-ativa"
      label="Loja"
      colunas={colunas}
      ajuda={<Link to="/selecionar-loja">Trocar de loja</Link>}
    >
      <input
        type="text"
        value={loja?.nomeLoja ?? ""}
        readOnly
        aria-readonly="true"
        data-cy="form-loja-ativa"
      />
    </FormField>
  );
}
