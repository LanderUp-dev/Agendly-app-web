// @requisito RO-30
import { describe, expect, it } from "vitest";
import { semanaDoDia } from "./periodoAgenda";

describe("semanaDoDia", () => {
  it("vai de segunda a domingo", () => {
    // 15/11/2026 é domingo
    expect(semanaDoDia(new Date(2026, 10, 15))).toEqual({ de: "2026-11-09", ate: "2026-11-15" });
    expect(semanaDoDia(new Date(2026, 10, 9))).toEqual({ de: "2026-11-09", ate: "2026-11-15" });
    expect(semanaDoDia(new Date(2026, 10, 12, 23, 59))).toEqual({
      de: "2026-11-09",
      ate: "2026-11-15",
    });
  });

  it("atravessa virada de mês e de ano", () => {
    // 01/01/2027 é sexta
    expect(semanaDoDia(new Date(2027, 0, 1))).toEqual({ de: "2026-12-28", ate: "2027-01-03" });
  });
});
