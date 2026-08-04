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
    
    let mensagem = msgServidor || 'Erro inesperado ao comunicar com o servidor.';

    if (error?.code === 'ERR_NETWORK') {
      mensagem = `Não foi possível conectar à API (${BASE_URL}).`;
    } else if (status === 400) {
      if (codigoCenario === 'INVALID_SLOT') {
        mensagem = msgServidor || 'Este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro horário.';
      } else if (codigoCenario === 'PAST_DATE') {
        mensagem = msgServidor || 'Não é possível realizar agendamentos para datas retroativas.';
      } else {
        mensagem = msgServidor || 'Requisição inválida.';
      }
    } else if (status === 401) {
      mensagem = msgServidor || 'Sua sessão expirou por inatividade. Faça login novamente.';
      
      if (typeof window !== 'undefined') {
        // Como o token está num cookie HttpOnly, você não pode limpá-lo via JS (localStorage.removeItem).
        // Se precisar avisar o back para invalidar, pode chamar uma rota /logout, 
        // ou apenas redirecionar para a tela de login (o back limpa o cookie no logout).
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (status === 403) {
      mensagem = msgServidor || 'Você não tem permissão para acessar esta área de agendamentos.';
    } else if (status === 404) {
      mensagem = msgServidor || 'O item ou agendamento solicitado não foi encontrado.';
    } else if (status === 409) {
      mensagem = msgServidor || 'O profissional selecionado já possui um compromisso agendado neste horário.';
    } else if (status === 422) {
      mensagem = msgServidor || 'Por favor, verifique os campos obrigatórios preenchidos incorretamente.';
    } else if (status === 429) {
      mensagem = msgServidor || 'Muitas requisições em pouco tempo. Aguarde alguns instantes.';
    } else if (status >= 500) {
      mensagem = msgServidor || 'Ocorreu um erro interno no servidor. Tente novamente em alguns minutos.';
    }

    if (typeof window !== 'undefined') {
      toast.error(mensagem, { id: codigoCenario || (status ? `error-${status}` : 'error-network') });
    }

    return Promise.reject(error);
  }
);

export default api;