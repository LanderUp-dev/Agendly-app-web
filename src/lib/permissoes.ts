// @requisito RS-02
import { obterLojaAtiva } from "@/lib/auth";

/**
 * Permissões do cargo na loja ativa (vêm de POST /auth/trocar-contexto).
 * O backend é quem barra de verdade (SecurityConfig): aqui só escondemos o que
 * o usuário não pode usar, para ele não dar de cara com um 403.
 * Chaves iguais a com.agendly.security.Permissoes.
 */
export type Permissao =
  | "CLIENTE_VER"
  | "CLIENTE_EDITAR"
  | "CLIENTE_EXCLUIR"
  | "AGENDAMENTO_VER"
  | "AGENDAMENTO_EDITAR"
  | "FUNCIONARIO_VER"
  | "FUNCIONARIO_EDITAR"
  | "SERVICO_VER"
  | "SERVICO_EDITAR"
  | "AREA_VER"
  | "AREA_EDITAR"
  | "COBRANCISTA_VER"
  | "COBRANCISTA_EDITAR"
  | "EQUIPE_VER"
  | "EQUIPE_EDITAR"
  | "LOJA_EDITAR"
  | "ASSINATURA_GERENCIAR";

/** Tela -> permissão exigida. Telas fora daqui não exigem permissão (ex.: lojas, escolher loja). */
export const PERMISSAO_DA_ROTA: Record<string, Permissao> = {
  "/agenda": "AGENDAMENTO_VER",
  "/listagem-clientes": "CLIENTE_VER",
  "/cadastro-cliente": "CLIENTE_EDITAR",
  "/listagem-funcionarios": "FUNCIONARIO_VER",
  "/cadastro-funcionario": "FUNCIONARIO_EDITAR",
  "/listagem-areas-funcionario": "FUNCIONARIO_VER",
  "/cadastro-area-funcionario": "FUNCIONARIO_EDITAR",
  "/listagem-servicos": "SERVICO_VER",
  "/cadastro-servico": "SERVICO_EDITAR",
  "/listagem-areas-atuacao": "AREA_VER",
  "/cadastro-area-atuacao": "AREA_EDITAR",
  "/listagem-cobrancistas": "COBRANCISTA_VER",
  "/cadastro-cobrancista": "COBRANCISTA_EDITAR",
  "/listagem-equipes": "EQUIPE_VER",
  "/cadastro-equipe": "EQUIPE_EDITAR",
};

/**
 * true se o cargo na loja ativa tem a permissão. Sessões antigas (salvas antes
 * das permissões existirem) não têm a lista: liberamos e o backend decide.
 */
export function temPermissao(permissao: Permissao): boolean {
  const loja = obterLojaAtiva();
  if (!loja || !Array.isArray(loja.permissoes)) return true;
  return loja.permissoes.includes(permissao);
}

/** true se o usuário pode abrir a tela (pelo caminho, ex.: "/cadastro-cliente"). */
export function podeAcessar(caminho: string): boolean {
  const permissao = PERMISSAO_DA_ROTA[caminho.replace(/\/+$/, "") || "/"];
  return permissao ? temPermissao(permissao) : true;
}

/** Para onde mandar quem abriu uma tela sem permissão. */
export function telaInicialPermitida(): string {
  return podeAcessar("/agenda") ? "/agenda" : "/listagem-lojas";
}
