/** Payload de POST /api/v1/usuarios (UsuarioDTO no backend). */
export interface UsuarioCadastroPayload {
  nome: string;
  sobrenome: string;
  email: string;
  celular: string;
  /** yyyy-MM-dd (LocalDate serializado pelo Jackson). */
  dtaNascimento: string;
  cpf: string;
  senha: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

/** EquipeDTO como vem dentro da resposta do login. */
export interface EquipeResumo {
  id: string;
  idUsuario?: number;
  idLoja?: number;
  idCargo?: number;
  nomeUsuario?: string;
  nomeLoja?: string;
  nomeCargo?: string;
}

/**
 * Resposta de POST /api/v1/auth/login (LoginResponseDTO, formato plano).
 * Em caso de falha o backend responde 401 com a mensagem dentro de `token`.
 */
export interface AuthResponse {
  token: string | null;
  tipo: string;
  id: number | null;
  nome: string | null;
  email: string | null;
  equipes: EquipeResumo[] | null;
}

export interface UsuarioResponse {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  celular: string;
  cpf: string;
  dtaNascimento: string;
}
