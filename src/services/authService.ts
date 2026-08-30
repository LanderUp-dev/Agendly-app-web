import api from '@/config/axios';
import { 
  UsuarioCadastroPayload, 
  LoginPayload, 
  AuthResponse, 
  UsuarioResponse 
} from '@/types/auth';

export const authService = {
  /**
   * Envia os dados de cadastro para POST /api/v1/usuarios
   */
  cadastrar: async (payload: UsuarioCadastroPayload): Promise<UsuarioResponse> => {
    const { data } = await api.post<UsuarioResponse>('/usuarios', payload);
    return data;
  },

  /**
   * Realiza login e recebe o cookie de sessão via POST /api/v1/auth/login
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  /**
   * Invalida a sessão no servidor
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  }
};