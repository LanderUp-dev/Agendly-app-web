// @requisito RE-09 RO-15
import { describe, expect, it } from "vitest";
import { dataBR, mesAtual, periodoDoMes, textoPendencia } from "./recebimentoUtil";

describe("recebimentoUtil", () => {
  it("calcula o período do mês, inclusive fevereiro bissexto", () => {
    expect(periodoDoMes("2026-11")).toEqual({ de: "2026-11-01", ate: "2026-11-30" });
    expect(periodoDoMes("2028-02")).toEqual({ de: "2028-02-01", ate: "2028-02-29" });
    expect(periodoDoMes("2026-12")).toEqual({ de: "2026-12-01", ate: "2026-12-31" });
  });

  it("formata mês e data", () => {
    expect(mesAtual(new Date(2026, 0, 15))).toBe("2026-01");
    expect(dataBR("2026-11-08")).toBe("08/11/2026");
    expect(dataBR(null)).toBe("—");
  });

  it("monta o texto da pendência", () => {
    expect(textoPendencia(null)).toBeNull();
    expect(
      textoPendencia({
        quantidade: 0,
        totalEmAberto: 0,
        totalVencido: 0,
        maisAntigoVencimento: null,
      }),
    ).toBeNull();
    const t = textoPendencia({
      quantidade: 2,
      totalEmAberto: 130,
      totalVencido: 30,
      maisAntigoVencimento: "2026-09-08",
    });
    expect(t).toContain("2 contas em aberto");
    expect(t).toContain("vencido desde 08/09/2026");
    expect(
      textoPendencia({
        quantidade: 1,
        totalEmAberto: 10,
        totalVencido: 0,
        maisAntigoVencimento: null,
      }),
    ).toContain("1 conta em aberto");
  });
});
