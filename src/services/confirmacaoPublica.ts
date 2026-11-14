// @requisito RO-37
import axios from "axios";
import { BASE_URL } from "@/config/axios";

/** O que o cliente vê na página do link (ConfirmacaoPublicaService.Resumo no backend). */
export interface ResumoConfirmacao {
  cliente?: string | null;
  servico?: string | null;
  profissional?: string | null;
  loja?: string | null;
  /** yyyy-MM-dd */
  data?: string | null;
  /** HH:mm:ss */
  horaInicio?: string | null;
  status: string;
  podeConfirmar: boolean;
}

/**
 * Cliente sem token e sem o interceptor global: quem abre o link não tem conta, e um 404 aqui
 * é tratado na própria página (não vira toast nem redireciona para o login).
 */
const publico = axios.create({ baseURL: BASE_URL, timeout: 15000 });

const caminho = (token: string) => `/publico/confirmacoes/${encodeURIComponent(token)}`;

export const confirmacaoPublicaService = {
  ver: (token: string) => publico.get<ResumoConfirmacao>(caminho(token)).then((r) => r.data),
  confirmar: (token: string) => publico.post<ResumoConfirmacao>(caminho(token)).then((r) => r.data),
};

/** Planos para a página inicial: mesma rota pública, sem toast se a API estiver fora. */
export const planosPublicos = () =>
  publico.get<unknown>("/planos").then((r) => (Array.isArray(r.data) ? r.data : []));
