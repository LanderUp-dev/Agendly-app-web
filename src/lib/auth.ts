/**
 * Sessão do usuário no front.
 *
 * O backend é stateless (JWT no header `Authorization: Bearer`), então o token
 * fica no localStorage e é injetado pelo interceptor do axios.
 * A checagem de expiração aqui é só para UX: quem valida de verdade é o backend.
 */

const TOKEN_KEY = "token";
const USER_KEY = "usuario";
const LOJA_KEY = "loja_ativa";

export interface UsuarioSessao {
  id?: number | string;
  nome?: string;
  email?: string;
}

/** Aceita a resposta do login como vem do backend (campos podem ser null). */
export interface DadosSessao {
  token?: string | null;
  id?: number | string | null;
  nome?: string | null;
  email?: string | null;
}

const temStorage = () => typeof window !== "undefined" && !!window.localStorage;

/** Formato básico de JWT: três partes base64url separadas por ponto. */
const FORMATO_JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/;

function decodificarPayload(token: string): Record<string, unknown> | null {
  try {
    const parte = token.split(".")[1];
    if (!parte) return null;
    const base64 = parte.replace(/-/g, "+").replace(/_/g, "/");
    const preenchido = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(preenchido));
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (!temStorage()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

/** true se não há token ou se o `exp` já passou. Token sem `exp` legível conta como válido. */
export function tokenExpirado(token: string | null = getToken()): boolean {
  if (!token) return true;
  const payload = decodificarPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return false; // sem exp: deixa o backend decidir
  return Date.now() >= exp * 1000;
}

/**
 * Salva o JWT e os dados básicos do usuário.
 * Retorna false se a resposta não trouxer um token com formato de JWT
 * (ex.: o backend devolve a mensagem de erro dentro do campo `token`).
 */
export function salvarSessao(dados: DadosSessao | null | undefined): boolean {
  if (!temStorage()) return false;
  const token = dados?.token;
  if (!token || !FORMATO_JWT.test(token)) return false;

  window.localStorage.setItem(TOKEN_KEY, token);
  limparCacheAdmin();
  const usuario: UsuarioSessao = {
    id: dados?.id ?? undefined,
    nome: dados?.nome ?? undefined,
    email: dados?.email ?? undefined,
  };
  window.localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  // Token novo de login é só de identidade: a loja precisa ser escolhida de novo.
  window.localStorage.removeItem(LOJA_KEY);
  return true;
}

export function obterUsuario(): UsuarioSessao | null {
  if (!temStorage()) return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UsuarioSessao) : null;
  } catch {
    return null;
  }
}

export function limparSessao(): void {
  if (!temStorage()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(LOJA_KEY);
  limparCacheAdmin();
}

/** "É admin da plataforma?" fica em cache na aba (services/acesso.ts): vale só para quem logou. */
function limparCacheAdmin() {
  try {
    window.sessionStorage.removeItem("agendly_admin");
  } catch {
    /* storage indisponível */
  }
}

// ---------------------------------------------------------------------------
// Loja ativa (contexto)
//
// O login devolve um token só de identidade. Para usar clientes, serviços,
// agenda etc., o backend exige um token de CONTEXTO, obtido em
// POST /auth/trocar-contexto com a equipe (vínculo usuário x loja). Os dados
// que a API devolve são sempre os da loja desse token.
// ---------------------------------------------------------------------------

export interface LojaAtiva {
  equipeId: string;
  lojaId: number;
  nomeLoja: string;
  cargo?: string;
  /** Permissões do cargo nesta loja (ver lib/permissoes.ts). */
  permissoes?: string[];
}

/** Resposta de POST /auth/trocar-contexto (ContextoResponseDTO). */
export interface DadosContexto {
  token?: string | null;
  equipeId?: string | null;
  lojaId?: number | null;
  lojaNome?: string | null;
  cargoNome?: string | null;
  permissoes?: string[] | null;
}

/** Troca o token de identidade pelo de contexto e guarda a loja ativa. */
export function salvarContexto(dados: DadosContexto | null | undefined): boolean {
  if (!temStorage()) return false;
  const token = dados?.token;
  if (!token || !FORMATO_JWT.test(token) || !dados?.equipeId || dados?.lojaId == null) return false;
  window.localStorage.setItem(TOKEN_KEY, token);
  const loja: LojaAtiva = {
    equipeId: dados.equipeId,
    lojaId: dados.lojaId,
    nomeLoja: dados.lojaNome ?? "",
    cargo: dados.cargoNome ?? undefined,
    permissoes: Array.isArray(dados.permissoes) ? dados.permissoes : [],
  };
  window.localStorage.setItem(LOJA_KEY, JSON.stringify(loja));
  return true;
}

export function obterLojaAtiva(): LojaAtiva | null {
  if (!temStorage() || !tokenTemContexto()) return null;
  try {
    const raw = window.localStorage.getItem(LOJA_KEY);
    return raw ? (JSON.parse(raw) as LojaAtiva) : null;
  } catch {
    return null;
  }
}

/** true se o token atual já tem loja selecionada (claim `equipeId`). */
export function tokenTemContexto(token: string | null = getToken()): boolean {
  if (!token) return false;
  const equipeId = decodificarPayload(token)?.equipeId;
  return typeof equipeId === "string" && equipeId.length > 0;
}

export function estaAutenticado(): boolean {
  const token = getToken();
  if (!token) return false;
  if (tokenExpirado(token)) {
    limparSessao();
    return false;
  }
  return true;
}
