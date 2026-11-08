// @requisito RE-08 RNR-18
import { describe, expect, it } from "vitest";
import { dataBR, dividirParcelas, mesAtual, periodoDoMes } from "./despesaUtil";

describe("despesaUtil", () => {
  it("período do mês considera o último dia (inclusive fevereiro bissexto)", () => {
    expect(periodoDoMes("2026-11")).toEqual({ de: "2026-11-01", ate: "2026-11-30" });
    expect(periodoDoMes("2028-02")).toEqual({ de: "2028-02-01", ate: "2028-02-29" });
    expect(periodoDoMes("2026-12")).toEqual({ de: "2026-12-01", ate: "2026-12-31" });
  });

  it("mês atual com dois dígitos", () => {
    expect(mesAtual(new Date(2026, 0, 15))).toBe("2026-01");
  });

  it("divide em centavos com a sobra na primeira parcela", () => {
    expect(dividirParcelas(100, 3)).toEqual([33.34, 33.33, 33.33]);
    expect(dividirParcelas(0.1, 3)).toEqual([0.04, 0.03, 0.03]);
    expect(dividirParcelas(50, 1)).toEqual([50]);
    expect(dividirParcelas(0.05, 6)).toEqual([]);
    expect(dividirParcelas(-10, 2)).toEqual([]);
    expect(dividirParcelas(10, 0)).toEqual([]);
  });

  it("data no formato brasileiro", () => {
    expect(dataBR("2026-11-08")).toBe("08/11/2026");
    expect(dataBR(null)).toBe("—");
  });
});
