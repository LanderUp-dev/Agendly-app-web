// @requisito RE-06 RE-07
import { describe, expect, it } from "vitest";
import {
  lerValor,
  paraCampo,
  reais,
  somar,
  valorAoSair,
  valorDigitado,
  valorParaMostrar,
} from "./dinheiro";

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
    expect(paraCampo(1234.5)).toBe("1.234,50");
  });

  it("limpa o que é digitado no campo de valor", () => {
    expect(valorDigitado("R$ 12")).toBe("12");
    expect(valorDigitado("12,505")).toBe("12,50");
    expect(valorDigitado("12.5")).toBe("12,5");
    expect(valorDigitado("1.234")).toBe("1.234");
    expect(valorDigitado("1.234,5")).toBe("1234,5");
    expect(valorDigitado("abc")).toBe("");
  });

  it("completa o valor ao sair do campo e mostra com R$", () => {
    expect(valorAoSair("12")).toBe("12,00");
    expect(valorAoSair("1234,5")).toBe("1.234,50");
    expect(valorAoSair("")).toBe("");
    expect(valorParaMostrar("1234,5", false)).toBe("R$ 1.234,50");
    expect(valorParaMostrar("12,", true)).toBe("R$ 12,");
    expect(valorParaMostrar("", false)).toBe("");
    // O que o campo mostra volta a ser lido igual.
    expect(lerValor(valorParaMostrar("1234,5", false))).toBe(1234.5);
  });
});
