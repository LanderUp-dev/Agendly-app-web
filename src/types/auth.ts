export interface UsuarioCadastroPayload {
  nome: string;
  sobrenome: string;
  email: string;
  celular: string;
  dataNascimento: string;
  cpf: string;
  senha: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface AuthResponse {
  message?: string;
}

export interface UsuarioResponse {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  celular: string;
  cpf: string;
  dataNascimento: string;
}