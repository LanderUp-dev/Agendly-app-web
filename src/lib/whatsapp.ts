// @requisito RO-37
/**
 * Fase 0 do WhatsApp: link wa.me com a mensagem pronta. Abre o WhatsApp (web ou celular)
 * já logado no número da loja, então a mensagem sai do contato da loja. Sem API, sem custo.
 * Viabilidade e próximas fases: Agendly-api/docs/viabilidade-whatsapp.md
 */

/** Só dígitos, com DDI 55 quando vier no formato nacional (DDD + número). */
export function telefoneWhatsApp(celular?: string | null): string | null {
  const digitos = (celular ?? "").replace(/\D/g, "");
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`;
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) return digitos;
  return null;
}

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export interface DadosConfirmacao {
  cliente: string;
  servico?: string;
  profissional?: string;
  /** dd/MM/yyyy */
  data: string;
  /** HH:mm */
  horaInicio: string;
  nomeLoja?: string;
}

export function mensagemConfirmacao(d: DadosConfirmacao): string {
  const [dia, mes, ano] = d.data.split("/").map(Number);
  const dataObj = new Date(ano, (mes ?? 1) - 1, dia ?? 1);
  const diaSemana = Number.isNaN(dataObj.getTime()) ? "" : `${DIAS[dataObj.getDay()]}, `;
  const primeiroNome = (d.cliente || "").trim().split(/\s+/)[0] || "";
  const partes = [
    `Olá${primeiroNome ? `, ${primeiroNome}` : ""}! Passando para confirmar seu horário`,
    d.servico ? ` de ${d.servico}` : "",
    d.profissional ? ` com ${d.profissional}` : "",
    ` ${diaSemana}${d.data.slice(0, 5)} às ${d.horaInicio}.`,
    "\n\nResponda *SIM* para confirmar ou nos avise se precisar remarcar.",
    // Assinatura no fim: "no/na <loja>" depende do nome, então evitamos a preposição.
    d.nomeLoja ? `\n\n${d.nomeLoja}` : "",
  ];
  return partes.join("");
}

/** https://wa.me/55DDDNUMERO?text=... ou null se o celular for inválido. */
export function linkWhatsApp(celular: string | null | undefined, texto: string): string | null {
  const numero = telefoneWhatsApp(celular);
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : null;
}
