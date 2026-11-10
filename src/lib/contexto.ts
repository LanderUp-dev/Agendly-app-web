// @requisito RO-34
/**
 * Escolha da loja ativa (token de contexto).
 *
 * Regras do backend:
 * - O login devolve um token só de identidade + as equipes (vínculos com lojas).
 * - Clientes, serviços, agenda etc. só respondem com token de contexto, obtido
 *   em POST /auth/trocar-contexto. Sem ele, a API responde 403.
 * - Os dados devolvidos são sempre os da loja do token; o front não manda idLoja.
 */
import api from "@/config/axios";
import { obterUsuario, salvarContexto, type LojaAtiva } from "@/lib/auth";
import type { EquipeResumo } from "@/types/auth";
import { adminService } from "@/services/acesso";

export const ROTA_SELECIONAR_LOJA = "/selecionar-loja";

/** Rotas autenticadas que funcionam sem loja selecionada. */
// /admin: o administrador da plataforma não precisa estar numa loja.
export const ROTAS_SEM_LOJA = [ROTA_SELECIONAR_LOJA, "/cadastro-loja", "/listagem-lojas", "/admin"];

export const rotaPrecisaDeLoja = (caminho: string) =>
  !ROTAS_SEM_LOJA.some((r) => caminho === r || caminho.startsWith(`${r}/`));

/** Vínculos do usuário logado com lojas (funciona com ou sem loja selecionada). */
export async function listarMinhasEquipes(): Promise<EquipeResumo[]> {
  const id = obterUsuario()?.id;
  if (id === undefined || id === null) return [];
  const { data } = await api.get<EquipeResumo[]>(
    `/usuarios/${encodeURIComponent(String(id))}/equipes`,
  );
  return Array.isArray(data) ? data : [];
}

/** Entra na loja da equipe: troca o token e guarda a loja ativa. */
export async function entrarNaLoja(equipeId: string): Promise<LojaAtiva> {
  const { data } = await api.post("/auth/trocar-contexto", { equipeId });
  if (!salvarContexto(data)) {
    throw new Error("Resposta inválida ao selecionar a loja");
  }
  return {
    equipeId: data.equipeId,
    lojaId: data.lojaId,
    nomeLoja: data.lojaNome ?? "",
    cargo: data.cargoNome ?? undefined,
    permissoes: Array.isArray(data.permissoes) ? data.permissoes : [],
  };
}

/**
 * Depois do login:
 * - sem loja → cadastro da primeira loja;
 * - uma loja → entra direto e vai para a agenda;
 * - várias → tela de escolha.
 */
export async function destinoAposLogin(
  equipes: EquipeResumo[] | null | undefined,
): Promise<string> {
  const lista = Array.isArray(equipes) ? equipes.filter((e) => e?.id) : [];
  if (lista.length === 0) {
    // Administrador da plataforma (ADMIN_EMAILS) sem loja própria vai direto para a
    // administração, em vez de cair no "cadastre sua loja".
    const admin = await adminService.souAdmin().catch(() => false);
    return admin ? "/admin" : "/cadastro-loja";
  }
  if (lista.length > 1) return ROTA_SELECIONAR_LOJA;
  try {
    await entrarNaLoja(lista[0].id);
    return "/agenda";
  } catch {
    return ROTA_SELECIONAR_LOJA;
  }
}

/** Depois de criar uma loja, entra nela (o backend já vinculou o criador como GERENTE). */
export async function entrarNaLojaCriada(lojaId: number | undefined): Promise<LojaAtiva | null> {
  if (lojaId === undefined || lojaId === null) return null;
  const equipe = (await listarMinhasEquipes()).find((e) => e.idLoja === lojaId);
  return equipe ? entrarNaLoja(equipe.id) : null;
}
