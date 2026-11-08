// @requisito RS-01 RS-02 RO-35 RS-10
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { getToken, limparSessao, tokenExpirado, tokenTemContexto } from "@/lib/auth";

/** Mesma rota de lib/contexto.ts (não importamos de lá para evitar ciclo: contexto usa este axios). */
const ROTA_SELECIONAR_LOJA = "/selecionar-loja";

/**
 * Base da API. Em dev o Vite faz proxy de /api para o Spring (vite.config.ts);
 * em produção o Nginx serve front e API no mesmo domínio. Assim não dependemos
 * de CORS no backend.
 */
export const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const ROTAS_PUBLICAS = ["/auth/login", "/auth/user/"];
const ehRotaPublica = (url = "") => ROTAS_PUBLICAS.some((r) => url.includes(r));
const ehLogin = (url = "") => url.includes("/auth/login");
/** Rotas da API que só respondem com loja selecionada (SecurityConfig.ROTAS_DA_LOJA). */
const ROTAS_DA_LOJA = [
  "/clientes",
  "/funcionarios",
  "/servicos",
  "/agendamentos",
  "/AreasAtuacoes",
  "/cobrancistas",
];
const ehRotaDeLoja = (url = "") => ROTAS_DA_LOJA.some((r) => url.includes(r));
const ehCadastroUsuario = (url = "", metodo = "") =>
  metodo.toLowerCase() === "post" && /\/usuarios\/?$/.test(url);

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    if (tokenExpirado(token)) {
      limparSessao();
    } else {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return config;
});

/**
 * O backend devolve erros como texto puro (ex.: "Nome do Cliente não Preenchido"),
 * às vezes como JSON padrão do Spring ({ message, error }).
 */
/** Erros de banco que o backend repassa crus (e-mail/CPF/CNPJ duplicado). */
const DUPLICIDADE = /unique|duplicate key|constraint|viola(ç|c)/i;
const SQL_CRU = /could not execute statement|SQL \[|insert into|update .* set/i;

export function extrairMensagemErro(data: unknown): string | null {
  if (!data) return null;
  if (typeof data === "string") {
    const texto = data.trim();
    if (!texto || texto.startsWith("<")) return null; // página HTML de erro
    // Nunca mostra SQL ao usuário: traduz duplicidade e esconde o resto.
    if (SQL_CRU.test(texto) || DUPLICIDADE.test(texto)) {
      return DUPLICIDADE.test(texto)
        ? "Já existe um cadastro com estes dados (e-mail ou documento)."
        : null;
    }
    return texto.length > 300 ? null : texto;
  }
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const msg = obj.message ?? obj.mensagem ?? obj.error;
    return typeof msg === "string" && msg.trim() ? msg.trim() : null;
  }
  return null;
}

let redirecionando = false;

function irPara(caminho: string) {
  if (typeof window === "undefined" || redirecionando) return;
  if (window.location.pathname === caminho) return;
  redirecionando = true;
  window.location.href = caminho;
}

const irParaLogin = () => irPara("/login");

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
    const metodo = error.config?.method ?? "";
    const msgServidor = extrairMensagemErro(error.response?.data);

    let mensagem: string;

    if (!error.response) {
      mensagem =
        error.code === "ECONNABORTED"
          ? "O servidor demorou para responder. Tente novamente."
          : "Não foi possível conectar ao servidor. Verifique sua conexão.";
    } else if (status === 401 && ehLogin(url)) {
      // O backend coloca a mensagem dentro do campo `token`; a LoginView
      // mostra um texto fixo no próprio formulário, então não há toast aqui.
      return Promise.reject(error);
    } else if (
      (status === 401 || status === 403) &&
      !ehRotaPublica(url) &&
      !ehCadastroUsuario(url, metodo)
    ) {
      // 403 pode significar três coisas:
      // 1. Token válido, mas sem loja selecionada: as rotas de negócio exigem
      //    token de contexto. Leva para a escolha da loja.
      // 2. Sem permissão no cargo ou regra de negócio, com mensagem em texto
      //    (ex.: "Informe a senha atual"): mostra a mensagem, sem sair.
      // 3. Sessão inválida (token ausente, expirado ou com assinatura inválida;
      //    sem AuthenticationEntryPoint o Spring responde 403): volta ao login.
      const token = getToken();
      const mensagemDeNegocio =
        status === 403 && typeof error.response?.data === "string" && !!msgServidor;
      // Só rotas de negócio exigem loja. 403 em qualquer outra rota (ex.:
      // /usuarios/{id}/equipes) com token sem loja = sessão inválida: senão o
      // usuário ficaria preso na tela de escolha da loja.
      // Vem antes da mensagem: o backend também manda texto ("Selecione uma loja...").
      if (
        status === 403 &&
        !tokenExpirado(token) &&
        !tokenTemContexto(token) &&
        ehRotaDeLoja(url)
      ) {
        toast.info("Escolha a loja para continuar.", { id: "escolher-loja" });
        irPara(ROTA_SELECIONAR_LOJA);
        return Promise.reject(error);
      }
      // Logado e na loja, mas o cargo não tem a permissão ("Seu cargo nesta loja não
      // tem permissão...") ou outra regra de negócio: mostra a mensagem e mantém a sessão.
      if (
        status === 403 &&
        !tokenExpirado(token) &&
        (mensagemDeNegocio || url.includes("/auth/trocar-contexto"))
      ) {
        mensagem = msgServidor || "Você não tem permissão para realizar esta ação.";
        toast.error(mensagem, { id: `erro-403-${mensagem}` });
        return Promise.reject(error);
      }
      limparSessao();
      mensagem = "Sua sessão expirou. Faça login novamente.";
      toast.error(mensagem, { id: "sessao-expirada" });
      irParaLogin();
      return Promise.reject(error);
    } else if (status === 402) {
      // Loja sem acesso (teste vencido, cortesia revogada, sem assinatura): vai para o plano.
      mensagem =
        msgServidor || "O acesso desta loja está suspenso. Escolha um plano para continuar.";
      toast.error(mensagem, { id: "loja-sem-acesso" });
      irPara("/plano");
      return Promise.reject(error);
    } else if (status === 400) {
      mensagem = msgServidor || "Dados inválidos. Verifique as informações.";
    } else if (status === 404) {
      mensagem = msgServidor || "Registro não encontrado.";
    } else if (status === 409) {
      mensagem = msgServidor || "Este registro já existe.";
    } else if (status && status >= 500) {
      mensagem = "Erro interno no servidor. Tente novamente mais tarde.";
    } else {
      mensagem = msgServidor || "Erro inesperado ao comunicar com o servidor.";
    }

    if (typeof window !== "undefined") {
      toast.error(mensagem, { id: `erro-${status ?? "rede"}-${mensagem}` });
    }

    return Promise.reject(error);
  },
);

export default api;
