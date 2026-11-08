// @requisito RO-35 RO-36 RS-07
import api from "@/config/axios";

/**
 * Acesso da loja (teste grátis, cortesia, assinatura) e administração da plataforma.
 * Backend: AcessoController, AdminController, PlanoController, AssinaturaController.
 */

export type TipoAcesso = "TESTE" | "CORTESIA" | "ASSINATURA" | "SEM_ACESSO";

export interface SituacaoAcesso {
  tipo: TipoAcesso;
  validoAte: string | null; // yyyy-MM-dd; null = sem prazo
  temAcesso: boolean;
  diasRestantes: number | null;
  revogado: boolean;
  motivo?: string | null;
  alteradoPor?: string | null;
  bloqueioAtivo?: boolean;
  /** Status da última assinatura no Mercado Pago (pending, authorized, paused, cancelled). */
  assinaturaStatus?: string | null;
}

export interface LojaAdmin {
  id: number;
  nome: string;
  cnpj?: string | null;
  email?: string | null;
  cidade?: string | null;
  acesso: SituacaoAcesso;
}

export interface PlanoPublico {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string | null;
  valorMensal: number;
  limiteProfissionais?: number | null;
}

export const ROTULO_TIPO: Record<TipoAcesso, string> = {
  TESTE: "Teste grátis",
  CORTESIA: "Cortesia",
  ASSINATURA: "Assinatura",
  SEM_ACESSO: "Sem acesso",
};

export const formatarData = (iso?: string | null) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

/** "Cortesia · sem prazo", "Teste grátis · até 21/11/2026 (5 dias)", "Cortesia · revogada"… */
export function descreverAcesso(a: SituacaoAcesso): string {
  const tipo = ROTULO_TIPO[a.tipo] ?? a.tipo;
  if (a.revogado) return `${tipo} · revogada`;
  if (a.tipo === "SEM_ACESSO") return tipo;
  if (!a.validoAte) return `${tipo} · sem prazo`;
  if (!a.temAcesso) return `${tipo} · venceu em ${formatarData(a.validoAte)}`;
  const dias = a.diasRestantes ?? 0;
  return `${tipo} · até ${formatarData(a.validoAte)} (${dias} ${dias === 1 ? "dia" : "dias"})`;
}

export const acessoService = {
  situacaoDaLoja: () => api.get<SituacaoAcesso>("/acesso").then((r) => r.data),
  planos: () => api.get<PlanoPublico[]>("/planos").then((r) => r.data),
  gerarLinkAssinatura: (idPlano: number) =>
    api.post<{ linkCheckout: string }>("/assinaturas/gerar-link", { idPlano }).then((r) => r.data),
};

const CHAVE_ADMIN = "agendly_admin";

export const adminService = {
  /** Nunca responde 403: { admin: false } para quem não é admin. Guardado na sessão da aba. */
  souAdmin: async (): Promise<boolean> => {
    try {
      const salvo = window.sessionStorage.getItem(CHAVE_ADMIN);
      if (salvo !== null) return salvo === "1";
    } catch {
      /* storage indisponível */
    }
    const { data } = await api.get<{ admin: boolean }>("/admin/eu");
    try {
      window.sessionStorage.setItem(CHAVE_ADMIN, data.admin ? "1" : "0");
    } catch {
      /* storage indisponível */
    }
    return !!data.admin;
  },
  limparCache: () => {
    try {
      window.sessionStorage.removeItem(CHAVE_ADMIN);
    } catch {
      /* storage indisponível */
    }
  },
  lojas: () => api.get<LojaAdmin[]>("/admin/lojas").then((r) => r.data),
  concederCortesia: (idLoja: number, validoAte: string | null, motivo: string) =>
    api
      .put<SituacaoAcesso>(`/admin/lojas/${idLoja}/cortesia`, { validoAte, motivo })
      .then((r) => r.data),
  revogarCortesia: (idLoja: number) =>
    api.delete<SituacaoAcesso>(`/admin/lojas/${idLoja}/cortesia`).then((r) => r.data),
};
