// @requisito RNR-23
import api from "@/config/axios";
import { useCarregar } from "@/hooks/useCarregar";

/** GET /funcionarios/limite: quantos profissionais o plano da loja permite (limite nulo = ilimitado). */
export interface SituacaoLimite {
  limite: number | null;
  cadastrados: number;
  plano: string | null;
  tipoAcesso: string | null;
  podeCadastrar: boolean;
}

export const buscarLimiteProfissionais = () =>
  api.get<SituacaoLimite>("/funcionarios/limite").then((r) => r.data);

/** Situação do limite; enquanto carrega ou se falhar, não bloqueia nada (o backend confere). */
export function useLimiteProfissionais() {
  const r = useCarregar<SituacaoLimite | null>(buscarLimiteProfissionais, null);
  return { situacao: r.erro ? null : r.dados, recarregar: r.recarregar };
}
