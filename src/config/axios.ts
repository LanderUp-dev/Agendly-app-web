import axios from 'axios';
import { toast } from 'sonner';

export const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const errorData = error?.response?.data;
    const codigoCenario = errorData?.code || errorData?.errorCode;
    const msgServidor = errorData?.message || errorData?.error;
    const urlRequisicao = error?.config?.url || '';

    let mensagem = msgServidor || 'Erro inesperado ao comunicar com o servidor.';

    if (error?.code === 'ERR_NETWORK') {
      mensagem = `Não foi possível conectar à API (${BASE_URL}).`;
    } else if (status === 400) {
      mensagem = msgServidor || 'Dados inválidos. Verifique as informações.';
    } else if (status === 401) {
      if (urlRequisicao.includes('/auth/login')) {
        mensagem = msgServidor || 'E-mail ou senha incorretos.';
      } else {
        mensagem = msgServidor || 'Sua sessão expirou. Faça login novamente.';
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (status === 403) {
      mensagem = msgServidor || 'Acesso negado.';
    } else if (status === 404) {
      mensagem = msgServidor || 'Recurso não encontrado.';
    } else if (status === 409) {
      mensagem = msgServidor || 'Conflito: registro já existente.';
    } else if (status === 422) {
      mensagem = msgServidor || 'Campos preenchidos incorretamente.';
    } else if (status >= 500) {
      mensagem = msgServidor || 'Erro interno no servidor. Tente novamente mais tarde.';
    }

    if (typeof window !== 'undefined') {
      toast.error(mensagem, {
        id: codigoCenario || (status ? `error-${status}-${Date.now()}` : 'error-network'),
      });
    }

    return Promise.reject(error);
  }
);

export default api;