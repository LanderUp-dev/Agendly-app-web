// @requisito RE-14
import { describe, expect, it } from "vitest";
import { limiteDoPlano, normalizarPlanos, precoSemSimbolo } from "./planosHome";

describe("planos da página inicial", () => {
  it("usa os valores do banco, do mais barato para o mais caro", () => {
    const planos = normalizarPlanos([
      {
        id: 2,
        codigo: "EQUIPE",
        nome: "Equipe",
        descricao: "Salões",
        valorMensal: 179.9,
        limiteProfissionais: 8,
      },
      {
        id: 1,
        codigo: "SOLO",
        nome: "Solo",
        descricao: "Autônomos",
        valorMensal: "69.00",
        limiteProfissionais: 1,
      },
    ]);
    expect(planos.map((p) => p.codigo)).toEqual(["SOLO", "EQUIPE"]);
    expect(planos[0].valorMensal).toBe(69);
    expect(precoSemSimbolo(planos[0].valorMensal)).toBe("69");
    expect(precoSemSimbolo(planos[1].valorMensal)).toBe("179,90");
  });

  it("ignora resposta que não é lista e plano sem nome ou sem preço", () => {
    expect(normalizarPlanos("<html>erro</html>")).toEqual([]);
    expect(
      normalizarPlanos([
        { nome: "", valorMensal: 10 },
        { nome: "X", valorMensal: "abc" },
      ]),
    ).toEqual([]);
  });

  it("descreve o limite de profissionais", () => {
    expect(limiteDoPlano(1)).toBe("1 profissional");
    expect(limiteDoPlano(6)).toContain("Até 6 profissionais");
    expect(limiteDoPlano(null)).toBe("Profissionais ilimitados");
  });
});
