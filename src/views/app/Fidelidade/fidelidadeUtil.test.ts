// @requisito RND-05
import { describe, expect, it } from "vitest";
import { percentualCiclo, periodoDoMes, textoFaltam } from "./fidelidadeUtil";

describe("fidelidade", () => {
  it("calcula o percentual do ciclo", () => {
    expect(percentualCiclo({ n: 4, noCiclo: 1 })).toBe(25);
    expect(percentualCiclo({ n: 10, noCiclo: 0 })).toBe(0);
    expect(percentualCiclo({ n: 3, noCiclo: 2 })).toBe(67);
    expect(percentualCiclo({ n: 0, noCiclo: 2 })).toBe(0);
  });

  it("monta a frase de quanto falta", () => {
    expect(textoFaltam({ faltam: 3, recompensa: "1 corte grátis" })).toBe(
      "Faltam 3 visitas para 1 corte grátis",
    );
    expect(textoFaltam({ faltam: 1, recompensa: "Escova" })).toBe("Falta 1 visita para Escova");
    expect(textoFaltam({ faltam: 2, recompensa: null })).toBe("Faltam 2 visitas para a recompensa");
  });

  it("calcula o período do mês", () => {
    expect(periodoDoMes("2026-02")).toEqual({ de: "2026-02-01", ate: "2026-02-28" });
    expect(periodoDoMes("2024-02")).toEqual({ de: "2024-02-01", ate: "2024-02-29" });
    expect(periodoDoMes("2026-11")).toEqual({ de: "2026-11-01", ate: "2026-11-30" });
  });
});
