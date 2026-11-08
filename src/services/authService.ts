import api from "@/config/axios";
import type {
  UsuarioCadastroPayload,
  LoginPayload,
  AuthResponse,
  UsuarioResponse,
} from "@/types/auth";

export const authService = {
  /** POST /api/v1/usuarios (rota pública). */
  cadastrar: async (payload: UsuarioCadastroPayload): Promise<UsuarioResponse> => {
    const { data } = await api.post<UsuarioResponse>("/usuarios", payload);
    return data;
  },

  /** POST /api/v1/auth/login -> JWT no corpo da resposta (sem cookie). */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },
};
