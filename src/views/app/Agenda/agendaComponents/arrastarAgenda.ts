// @requisito RU-01 RO-32 RO-33
/**
 * Funções puras da agenda: arrastar e soltar (RU-01) e filtro por área (RO-33).
 * Sem DOM e sem React, para poder testar com vitest.
 */

export const MINUTOS_NO_DIA = 24 * 60;

/** "14:30" -> 870. */
export const horaEmMinutos = (hhmm: string): number => {
  const [h, m] = (hhmm || "00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** 870 -> "14:30". */
export const minutosEmHora = (minutos: number): string =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

/** Arredonda para o passo da grade (15/30/60) mais próximo. */
export const encaixar = (minutos: number, passo: number): number =>
  Math.round(minutos / passo) * passo;

/** Situações que não podem ser movidas (cancelado, fechado/pago, faltou). */
const STATUS_FIXOS = ["CANCELADO", "CONCLUIDO", "NAO_COMPARECEU"];

export const podeMover = (status?: string): boolean => !STATUS_FIXOS.includes(status ?? "AGENDADO");

/** Coluna da grade em coordenadas do conteúdo (já somado o scroll). */
export interface ColunaGeometria {
  inicio: number;
  largura: number;
}

export interface GeometriaGrade {
  colunas: ColunaGeometria[];
  /** Topo da primeira linha (00:00), abaixo do cabeçalho. */
  topoLinhas: number;
  alturaLinha: number;
  passo: number;
}

export interface Destino {
  coluna: number;
  /** Início, em minutos desde 00:00, já encaixado no passo. */
  minutos: number;
}

/**
 * Onde o bloco cai, a partir da posição do ponteiro no conteúdo da grade.
 * `y` é o topo do bloco (ponteiro menos o ponto onde ele foi pego).
 * Fora das colunas: null. O horário fica entre 00:00 e o último início que cabe no dia.
 */
export const destinoDaPosicao = (
  x: number,
  y: number,
  g: GeometriaGrade,
  duracaoMinutos: number,
): Destino | null => {
  const coluna = g.colunas.findIndex((c) => x >= c.inicio && x < c.inicio + c.largura);
  if (coluna < 0 || g.alturaLinha <= 0 || g.passo <= 0) return null;
  const bruto = ((y - g.topoLinhas) / g.alturaLinha) * g.passo;
  // Último início cujo fim ainda cabe no dia (fim até 23:59).
  const ultimo = Math.floor((MINUTOS_NO_DIA - 1 - Math.max(duracaoMinutos, 0)) / g.passo) * g.passo;
  const minutos = Math.min(Math.max(encaixar(bruto, g.passo), 0), Math.max(ultimo, 0));
  return { coluna, minutos };
};

/** Topo (px, no conteúdo) de um horário na grade. */
export const topoDoHorario = (
  minutos: number,
  g: Pick<GeometriaGrade, "topoLinhas" | "alturaLinha" | "passo">,
) => g.topoLinhas + (minutos / g.passo) * g.alturaLinha;

/** dd/MM/yyyy -> yyyy-MM-dd. */
export const brParaIso = (data: string): string => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : data;
};

/** Date local -> yyyy-MM-dd. */
export const isoDoDia = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Horário já passou? Mesma regra do motor de horários (DisponibilidadeController):
 * dia anterior a hoje, ou hoje antes da hora atual.
 */
export const ehPassado = (dataIso: string, hora: string, agora: Date = new Date()): boolean => {
  const hoje = isoDoDia(agora);
  if (dataIso < hoje) return true;
  if (dataIso > hoje) return false;
  return horaEmMinutos(hora) < agora.getHours() * 60 + agora.getMinutes();
};

/** Novo fim mantendo a duração. null se passar da meia-noite. */
export const novoFim = (inicio: string, fim: string, novoInicio: string): string | null => {
  const duracao = Math.max(horaEmMinutos(fim) - horaEmMinutos(inicio), 0);
  const fimMin = horaEmMinutos(novoInicio) + duracao;
  // O backend guarda LocalTime: o fim precisa ser no mesmo dia (até 23:59).
  return fimMin >= MINUTOS_NO_DIA ? null : minutosEmHora(fimMin);
};

/** Mudou alguma coisa (horário, data ou profissional)? */
export const mudouDestino = (
  origem: { data: string; hora: string; idFuncionario?: number },
  destino: { data: string; hora: string; idFuncionario?: number },
) =>
  origem.data !== destino.data ||
  origem.hora !== destino.hora ||
  origem.idFuncionario !== destino.idFuncionario;

// ------------------------------------------------------------------ RO-33

export interface ProfissionalComArea {
  /** Identidade na agenda (as funções devolvem String(id)): nomes podem se repetir. */
  id: number;
  nome: string;
  areas: number[];
}

/**
 * Colunas visíveis: profissional marcado E (sem área escolhida OU da área escolhida).
 * Os dois filtros são independentes: trocar a área não desmarca ninguém.
 */
export const colunasVisiveis = (
  profissionais: ProfissionalComArea[],
  selecionados: string[],
  area: number | null,
): string[] =>
  profissionais
    .filter((p) => selecionados.includes(String(p.id)))
    .filter((p) => area == null || p.areas.includes(area))
    .map((p) => String(p.id));

/** Profissionais listados no filtro lateral (os da área escolhida, ou todos). */
export const profissionaisDaArea = (
  profissionais: ProfissionalComArea[],
  area: number | null,
): string[] =>
  profissionais.filter((p) => area == null || p.areas.includes(area)).map((p) => String(p.id));
