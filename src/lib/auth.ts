// @ts-nocheck
const TOKEN_KEY = 'token';
const USER_KEY = 'usuario';

/** Salva o JWT retornado pelo backend (/api/v1/auth/google) e os dados básicos do usuário. */
export function salvarSessao(dados: { token: string; id?: unknown; nome?: string; email?: string }) {
  if (!dados?.token) return;
  localStorage.setItem(TOKEN_KEY, dados.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({ id: dados.id, nome: dados.nome, email: dados.email })
  );
}

export function obterUsuario(): { id?: unknown; nome?: string; email?: string } | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function limparSessao() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function estaAutenticado() {
  return typeof window !== 'undefined' && !!window.localStorage.getItem(TOKEN_KEY);
}
