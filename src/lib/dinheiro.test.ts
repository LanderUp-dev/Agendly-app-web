// @requisito RE-06 RE-07
import { describe, expect, it } from "vitest";
import { lerValor, paraCampo, reais, somar } from "./dinheiro";

describe("dinheiro", () => {
  it("lê valores no formato brasileiro e com ponto", () => {
    expect(lerValor("12,50")).toBe(12.5);
    expect(lerValor("1.234,56")).toBe(1234.56);
    expect(lerValor("R$ 10")).toBe(10);
    expect(lerValor("12.5")).toBe(12.5);
    expect(lerValor("1.234")).toBe(1234);
    expect(lerValor("0,005")).toBe(0.01);
  });

  it("vazio ou inválido vira null", () => {
    expect(lerValor("")).toBeNull();
    expect(lerValor("abc")).toBeNull();
    expect(lerValor("1,2,3")).toBeNull();
  });

  it("formata e soma sem erro de ponto flutuante", () => {
    expect(paraCampo(12.5)).toBe("12,50");
    expect(somar([0.1, 0.2])).toBe(0.3);
    expect(reais(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });
});
