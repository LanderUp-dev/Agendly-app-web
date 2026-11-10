// @requisito RO-28 RO-29
import { describe, expect, it } from "vitest";
import { podeDarCargo, rotuloCargo } from "./cargoEquipe";
import { agruparPermissoes } from "@/services/cargos";

const tem = (lista: string[]) => (p: string) => lista.includes(p);

describe("podeDarCargo / rotuloCargo", () => {
  it("libera cargo cujas permissões o usuário tem", () => {
    const cargo = { nome: "Recepção", doSistema: false, permissoes: ["CLIENTE_VER"] };
    expect(podeDarCargo(cargo, tem(["CLIENTE_VER", "AGENDAMENTO_VER"]))).toBe(true);
    expect(rotuloCargo(cargo, tem(["CLIENTE_VER"]))).toBe("Recepção");
  });

  it("bloqueia cargo com permissão que o usuário não tem", () => {
    const cargo = { nome: "GERENTE", doSistema: true, permissoes: ["CLIENTE_VER", "LOJA_EDITAR"] };
    expect(podeDarCargo(cargo, tem(["CLIENTE_VER"]))).toBe(false);
    expect(rotuloCargo(cargo, tem(["CLIENTE_VER"]))).toBe(
      "GERENTE (padrão) — tem permissões que você não tem",
    );
  });
});

describe("agruparPermissoes", () => {
  it("agrupa pelo prefixo na ordem das áreas e manda chaves novas para Outras", () => {
    const grupos = agruparPermissoes([
      { chave: "CAIXA_GERENCIAR", descricao: "Caixa" },
      { chave: "CLIENTE_VER", descricao: "Ver clientes" },
      { chave: "CARGO_GERENCIAR", descricao: "Cargos" },
      { chave: "EQUIPE_VER", descricao: "Equipe" },
      { chave: "NOVA_COISA", descricao: "Nova" },
    ]);
    expect(grupos.map((g) => g.area)).toEqual([
      "Clientes",
      "Equipe e cargos",
      "Financeiro",
      "Outras",
    ]);
    expect(grupos[1].permissoes.map((p) => p.chave)).toEqual(["CARGO_GERENCIAR", "EQUIPE_VER"]);
  });
});
