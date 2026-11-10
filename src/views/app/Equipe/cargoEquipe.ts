// @requisito RO-28 RO-29
import { temPermissao, type Permissao } from "@/lib/permissoes";
import type { Cargo } from "@/services/cargos";

/**
 * O backend só deixa dar a alguém um cargo cujas permissões o usuário logado também tem
 * (anti-escalada). Aqui só antecipamos isso para desabilitar a opção.
 */
export function podeDarCargo(
  cargo: Pick<Cargo, "permissoes">,
  tem: (p: Permissao) => boolean = temPermissao,
): boolean {
  return cargo.permissoes.every((p) => tem(p as Permissao));
}

export function rotuloCargo(
  cargo: Pick<Cargo, "nome" | "doSistema" | "permissoes">,
  tem: (p: Permissao) => boolean = temPermissao,
): string {
  const base = cargo.doSistema ? `${cargo.nome} (padrão)` : cargo.nome;
  return podeDarCargo(cargo, tem) ? base : `${base} — tem permissões que você não tem`;
}
