// @requisito RO-43
import { describe, expect, it } from "vitest";
import { descricaoSino, quandoFoi, rotuloContagem } from "./notificacoes";

describe("rotuloContagem", () => {
  it("some com zero e mostra 9+ acima de 9", () => {
    expect(rotuloContagem(0)).toBe("");
    expect(rotuloContagem(-1)).toBe("");
    expect(rotuloContagem(1)).toBe("1");
    expect(rotuloContagem(9)).toBe("9");
    expect(rotuloContagem(10)).toBe("9+");
    expect(rotuloContagem(250)).toBe("9+");
  });
});

describe("descricaoSino", () => {
  it("diz o número no singular e no plural", () => {
    expect(descricaoSino(0)).toBe("Avisos: nenhum aviso novo");
    expect(descricaoSino(1)).toBe("Avisos: 1 aviso não lido");
    expect(descricaoSino(12)).toBe("Avisos: 12 avisos não lidos");
  });
});

describe("quandoFoi", () => {
  const agora = new Date("2026-11-10T15:00:00");
  it("mostra tempo relativo no mesmo dia e a data depois", () => {
    expect(quandoFoi("2026-11-10T14:59:40", agora)).toBe("agora");
    expect(quandoFoi("2026-11-10T14:55:00", agora)).toBe("há 5 min");
    expect(quandoFoi("2026-11-10T12:00:00", agora)).toBe("há 3 h");
    expect(quandoFoi("2026-11-08T09:30:00", agora)).toMatch(/08\/11.*09:30/);
    expect(quandoFoi("invalida", agora)).toBe("");
  });
});
