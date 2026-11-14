// @requisito RO-44
import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/axios", () => ({ default: {}, BASE_URL: "/api/v1" }));

import { diasDisponiveis, juntarHorarios, linkAgendar } from "./agendaOnline";

describe("agendamento online (apoio da página pública)", () => {
  it("monta o link público da loja", () => {
    expect(linkAgendar("barbearia-do-ze", "https://agendly.exemplo/")).toBe(
      "https://agendly.exemplo/agendar/barbearia-do-ze",
    );
    expect(linkAgendar("", "https://agendly.exemplo")).toBeNull();
  });

  it("lista os dias de hoje até o limite, virando mês e ano", () => {
    const dias = diasDisponiveis("2026-12-30", 3);
    expect(dias.map((d) => d.iso)).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
    expect(dias.map((d) => d.semana)).toEqual(["hoje", "amanhã", "sex", "sáb"]);
    expect(dias[2].dia).toBe("01/01");
    expect(diasDisponiveis("data ruim", 5)).toEqual([]);
  });

  it("junta os horários dos profissionais sem repetir, em ordem", () => {
    expect(
      juntarHorarios([
        { idFuncionario: 1, nome: "Ana", horarios: ["10:00", "09:00"] },
        { idFuncionario: 2, nome: "Bia", horarios: ["09:00", "09:30"] },
      ]),
    ).toEqual(["09:00", "09:30", "10:00"]);
    expect(juntarHorarios([])).toEqual([]);
  });
});
