// @requisito RO-37
import { describe, expect, it } from "vitest";
import { linkWhatsApp, mensagemConfirmacao, telefoneWhatsApp } from "./whatsapp";

describe("whatsapp (Fase 0)", () => {
  it("normaliza celular brasileiro com DDI 55", () => {
    expect(telefoneWhatsApp("(32) 99999-0000")).toBe("5532999990000");
    expect(telefoneWhatsApp("3233334444")).toBe("553233334444");
    expect(telefoneWhatsApp("+55 32 99999-0000")).toBe("5532999990000");
    expect(telefoneWhatsApp("12345")).toBeNull();
    expect(telefoneWhatsApp(undefined)).toBeNull();
  });

  it("monta a mensagem com dia da semana, serviço, profissional e assinatura da loja", () => {
    const texto = mensagemConfirmacao({
      cliente: "Maria Souza",
      servico: "Corte",
      profissional: "Ana",
      data: "14/11/2026",
      horaInicio: "10:00",
      nomeLoja: "Salão X",
    });
    expect(texto).toContain("Olá, Maria!");
    expect(texto).toContain("de Corte com Ana sábado, 14/11 às 10:00.");
    expect(texto).toContain("Responda *SIM*");
    expect(texto.endsWith("\n\nSalão X")).toBe(true);
  });

  it("gera link wa.me com o texto codificado, ou null sem celular válido", () => {
    const link = linkWhatsApp("32999990000", "Olá & tchau");
    expect(link).toBe("https://wa.me/5532999990000?text=Ol%C3%A1%20%26%20tchau");
    expect(linkWhatsApp("", "x")).toBeNull();
  });
});
