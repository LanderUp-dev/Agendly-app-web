/**
 * Lista de todas as telas (/telas): ferramenta interna para conferir o app, nunca para os
 * clientes. Liga só:
 * - rodando em desenvolvimento (npm run dev), ou
 * - num build com VITE_LISTA_TELAS=true (ex.: um servidor da branch dev).
 * No build de produção sem a chave, o menu nem tem o link e /telas volta para a home.
 */
export const LISTA_TELAS_LIGADA: boolean =
  import.meta.env.DEV || import.meta.env.VITE_LISTA_TELAS === "true";
