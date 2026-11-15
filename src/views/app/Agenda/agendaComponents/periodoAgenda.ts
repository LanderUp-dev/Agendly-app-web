// @requisito RO-30
import { isoDoDia } from "./arrastarAgenda";

export interface PeriodoAgenda {
  /** AAAA-MM-DD, inclusive. */
  de: string;
  /** AAAA-MM-DD, inclusive. */
  ate: string;
}

/**
 * Semana (segunda a domingo) do dia mostrado na agenda. A agenda busca a semana inteira
 * de uma vez: andar dia a dia dentro dela não faz nova chamada, e o volume não cresce
 * com o histórico da loja.
 */
export const semanaDoDia = (dia: Date): PeriodoAgenda => {
  const segunda = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate());
  segunda.setDate(segunda.getDate() - ((segunda.getDay() + 6) % 7));
  const domingo = new Date(segunda.getFullYear(), segunda.getMonth(), segunda.getDate() + 6);
  return { de: isoDoDia(segunda), ate: isoDoDia(domingo) };
};
