// @requisito RU-01 RO-32 RO-33
import { describe, expect, it } from "vitest";
import {
  brParaIso,
  colunasVisiveis,
  destinoDaPosicao,
  ehPassado,
  encaixar,
  horaEmMinutos,
  minutosEmHora,
  mudouDestino,
  novoFim,
  podeMover,
  profissionaisDaArea,
  topoDoHorario,
  type GeometriaGrade,
} from "./arrastarAgenda";

const grade = (passo: number, alturaLinha: number): GeometriaGrade => ({
  colunas: [
    { inicio: 64, largura: 200 },
    { inicio: 264, largura: 200 },
  ],
  topoLinhas: 48,
  alturaLinha,
  passo,
});

describe("horários", () => {
  it("converte HH:mm <-> minutos", () => {
    expect(horaEmMinutos("14:30")).toBe(870);
    expect(minutosEmHora(870)).toBe("14:30");
    expect(minutosEmHora(0)).toBe("00:00");
  });

  it("encaixa no passo da grade", () => {
    expect(encaixar(37, 15)).toBe(30);
    expect(encaixar(38, 15)).toBe(45);
    expect(encaixar(44, 30)).toBe(30);
    expect(encaixar(46, 30)).toBe(60);
    expect(encaixar(29, 60)).toBe(0);
  });

  it("novo fim mantém a duração e recusa passar da meia-noite", () => {
    expect(novoFim("09:00", "10:30", "14:15")).toBe("15:45");
    expect(novoFim("09:00", "10:00", "23:00")).toBeNull();
    expect(novoFim("09:00", "09:30", "23:00")).toBe("23:30");
  });

  it("dd/MM/yyyy para ISO", () => {
    expect(brParaIso("08/11/2026")).toBe("2026-11-08");
  });
});

describe("destinoDaPosicao", () => {
  it("acha a coluna pelo x e o horário pelo y, na granularidade 60", () => {
    // linha de 64px por hora; topo das linhas em 48px. 14:00 = 48 + 14*64 = 944
    expect(destinoDaPosicao(100, 944, grade(60, 64), 60)).toEqual({ coluna: 0, minutos: 840 });
    expect(destinoDaPosicao(300, 944 + 20, grade(60, 64), 60)).toEqual({
      coluna: 1,
      minutos: 840,
    });
    expect(destinoDaPosicao(300, 944 + 40, grade(60, 64), 60)).toEqual({
      coluna: 1,
      minutos: 900,
    });
  });

  it("encaixa em 15 e 30 minutos", () => {
    // 30 min = 44px. 10:30 = 48 + 21*44 = 972
    expect(destinoDaPosicao(100, 972 + 10, grade(30, 44), 30)?.minutos).toBe(630);
    // 15 min = 32px. 10:45 = 48 + 43*32 = 1424
    expect(destinoDaPosicao(100, 1424 - 10, grade(15, 32), 30)?.minutos).toBe(645);
  });

  it("fora das colunas = null; acima do topo = 00:00; não passa do fim do dia", () => {
    expect(destinoDaPosicao(10, 500, grade(60, 64), 60)).toBeNull();
    expect(destinoDaPosicao(500, 500, grade(60, 64), 60)).toBeNull();
    expect(destinoDaPosicao(100, 0, grade(60, 64), 60)?.minutos).toBe(0);
    // 90 min de duração: último início com fim até 23:59 na grade de 30 = 22:00
    expect(destinoDaPosicao(100, 99999, grade(30, 44), 90)?.minutos).toBe(22 * 60);
  });

  it("topoDoHorario é o inverso da posição", () => {
    const g = grade(30, 44);
    const top = topoDoHorario(630, g);
    expect(destinoDaPosicao(100, top, g, 30)?.minutos).toBe(630);
  });
});

describe("regras do arraste", () => {
  it("cancelado, concluído (comanda fechada) e falta não se movem", () => {
    expect(podeMover("AGENDADO")).toBe(true);
    expect(podeMover("CONFIRMADO")).toBe(true);
    expect(podeMover(undefined)).toBe(true);
    expect(podeMover("CANCELADO")).toBe(false);
    expect(podeMover("CONCLUIDO")).toBe(false);
    expect(podeMover("NAO_COMPARECEU")).toBe(false);
  });

  it("horário passado: dia anterior ou hoje antes de agora", () => {
    const agora = new Date(2026, 10, 8, 14, 20);
    expect(ehPassado("2026-11-07", "23:00", agora)).toBe(true);
    expect(ehPassado("2026-11-08", "14:00", agora)).toBe(true);
    expect(ehPassado("2026-11-08", "14:30", agora)).toBe(false);
    expect(ehPassado("2026-11-09", "08:00", agora)).toBe(false);
  });

  it("detecta se o destino mudou", () => {
    const o = { data: "2026-11-09", hora: "09:00", idFuncionario: 1 };
    expect(mudouDestino(o, { ...o })).toBe(false);
    expect(mudouDestino(o, { ...o, hora: "09:30" })).toBe(true);
    expect(mudouDestino(o, { ...o, idFuncionario: 2 })).toBe(true);
  });
});

describe("filtro por área (RO-33)", () => {
  // Chaves = ids. Dois profissionais com o mesmo nome (Ana) continuam separados.
  const equipe = [
    { id: 1, nome: "Ana", areas: [1] },
    { id: 2, nome: "Bia", areas: [1, 2] },
    { id: 3, nome: "Caio", areas: [2] },
    { id: 4, nome: "Duda", areas: [] },
    { id: 5, nome: "Ana", areas: [2] },
  ];

  it("sem área: só o filtro de profissional", () => {
    expect(colunasVisiveis(equipe, ["1", "3", "4"], null)).toEqual(["1", "3", "4"]);
    expect(profissionaisDaArea(equipe, null)).toHaveLength(5);
  });

  it("com área: profissional marcado E da área (os dois filtros somam)", () => {
    expect(colunasVisiveis(equipe, ["1", "2", "3", "4"], 2)).toEqual(["2", "3"]);
    expect(colunasVisiveis(equipe, ["1", "3"], 1)).toEqual(["1"]);
    expect(profissionaisDaArea(equipe, 1)).toEqual(["1", "2"]);
  });

  it("dois profissionais com o mesmo nome são colunas diferentes", () => {
    expect(colunasVisiveis(equipe, ["1", "5"], null)).toEqual(["1", "5"]);
    expect(colunasVisiveis(equipe, ["5"], null)).toEqual(["5"]);
    expect(profissionaisDaArea(equipe, 2)).toEqual(["2", "3", "5"]);
  });
});
