import { describe, expect, it } from "vitest";
import {
  idadeValida,
  somenteDigitos,
  validarCNPJ,
  validarCPF,
  validarCelular,
  validarTelefoneFixo,
} from "./validators";

describe("validators", () => {
  it("somenteDigitos remove máscara", () => {
    expect(somenteDigitos("529.982.247-25")).toBe("52998224725");
    expect(somenteDigitos(undefined)).toBe("");
  });

  it("validarCPF", () => {
    expect(validarCPF("529.982.247-25")).toBe(true);
    expect(validarCPF("12345678901")).toBe(false);
    expect(validarCPF("11111111111")).toBe(false);
    expect(validarCPF("123")).toBe(false);
  });

  it("validarCNPJ", () => {
    expect(validarCNPJ("11.222.333/0001-81")).toBe(true);
    expect(validarCNPJ("11222333000180")).toBe(false);
    expect(validarCNPJ("00000000000000")).toBe(false);
  });

  it("validarCelular e validarTelefoneFixo", () => {
    expect(validarCelular("(11) 99999-8888")).toBe(true);
    expect(validarCelular("1133334444")).toBe(false);
    expect(validarTelefoneFixo("(11) 3333-4444")).toBe(true);
    expect(validarTelefoneFixo("11999998888")).toBe(false);
  });

  it("idadeValida segue a regra do backend (18 a 99 anos, sem data futura)", () => {
    const hoje = new Date(2026, 10, 7); // 07/11/2026
    expect(idadeValida("2008-11-07", hoje)).toBe(true); // faz 18 hoje
    expect(idadeValida("2008-11-08", hoje)).toBe(false); // 17 anos
    expect(idadeValida("1926-11-08", hoje)).toBe(true); // 99 anos
    expect(idadeValida("1926-11-07", hoje)).toBe(false); // 100 anos
    expect(idadeValida("2030-01-01", hoje)).toBe(false);
    expect(idadeValida("2000-02-30", hoje)).toBe(false);
    expect(idadeValida("", hoje)).toBe(false);
  });
});
