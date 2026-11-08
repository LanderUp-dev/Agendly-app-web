// @requisito RO-40
import { describe, expect, it } from "vitest";
import { avaliarSenha, senhaValida } from "./senha";

describe("senha", () => {
  it("exige 8 caracteres, letra e número", () => {
    expect(senhaValida("Agendly2026")).toBe(true);
    expect(senhaValida("abc12")).toBe(false);
    expect(senhaValida("somenteletras")).toBe(false);
    expect(senhaValida("12345678")).toBe(false);
  });

  it("mostra cada requisito separado", () => {
    expect(avaliarSenha("abc")).toEqual({ tamanho: false, letra: true, numero: false });
  });
});
