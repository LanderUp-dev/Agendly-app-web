// @requisito RE-15 RE-16 RO-29 RO-28
import api from "@/config/axios";

/** Cargo visível na loja ativa. `doSistema`: GERENTE/COLABORADOR (só leitura). */
export interface Cargo {
  id: number;
  nome: string;
  descricao?: string | null;
  doSistema: boolean;
  permissoes: string[];
  /** Pessoas da equipe desta loja com este cargo. */
  pessoas: number;
}

export interface PermissaoCatalogo {
  chave: string;
  descricao: string;
}

export interface CargoForm {
  nome: string;
  descricao?: string;
  permissoes: string[];
}

/** Membro da equipe com o id do cargo (para trocar o cargo na listagem). */
export interface MembroEquipe {
  id: string;
  nomeUsuario: string;
  nomeLoja: string;
  idCargo?: number;
  nomeCargo: string;
}

export const cargosService = {
  listar: () => api.get<Cargo[]>("/cargos").then((r) => r.data),
  catalogo: () => api.get<PermissaoCatalogo[]>("/permissoes").then((r) => r.data),
  criar: (dados: CargoForm) => api.post<Cargo>("/cargos", dados).then((r) => r.data),
  editar: (id: number, dados: CargoForm) =>
    api.put<Cargo>(`/cargos/${id}`, dados).then((r) => r.data),
  excluir: (id: number) => api.delete(`/cargos/${id}`).then(() => undefined),
  duplicar: (id: number) => api.post<Cargo>(`/cargos/${id}/duplicar`).then((r) => r.data),
};

export const equipeCargoService = {
  listarMembros: () =>
    api.get<MembroEquipe[]>("/equipes").then((r) =>
      (Array.isArray(r.data) ? r.data : []).map((m) => ({
        id: String(m.id),
        nomeUsuario: m.nomeUsuario ?? "",
        nomeLoja: m.nomeLoja ?? "",
        idCargo: m.idCargo,
        nomeCargo: m.nomeCargo ?? "",
      })),
    ),
  mudarCargo: (idEquipe: string, idCargo: number) =>
    api.put(`/equipes/${encodeURIComponent(idEquipe)}`, { idCargo }).then((r) => r.data),
};

/** Áreas para agrupar as permissões na tela (pelo prefixo da chave). */
const AREAS: { area: string; prefixos: string[] }[] = [
  { area: "Clientes", prefixos: ["CLIENTE"] },
  { area: "Agenda", prefixos: ["AGENDAMENTO"] },
  { area: "Funcionários", prefixos: ["FUNCIONARIO"] },
  { area: "Serviços", prefixos: ["SERVICO"] },
  { area: "Áreas de atuação", prefixos: ["AREA"] },
  { area: "Cobrancistas", prefixos: ["COBRANCISTA"] },
  { area: "Equipe e cargos", prefixos: ["EQUIPE", "CARGO"] },
  { area: "Loja e plano", prefixos: ["LOJA", "ASSINATURA"] },
  {
    area: "Financeiro",
    prefixos: ["COMANDA", "CAIXA", "FINANCEIRO", "DESPESA", "RECEBIMENTO", "SALARIO"],
  },
];

export interface GrupoPermissoes {
  area: string;
  permissoes: PermissaoCatalogo[];
}

/** Agrupa o catálogo por área, na ordem de AREAS; chaves novas caem em "Outras". */
export function agruparPermissoes(catalogo: PermissaoCatalogo[]): GrupoPermissoes[] {
  const prefixo = (chave: string) => chave.split("_")[0];
  const grupos: GrupoPermissoes[] = AREAS.map((a) => ({
    area: a.area,
    permissoes: catalogo.filter((p) => a.prefixos.includes(prefixo(p.chave))),
  }));
  const conhecidos = new Set(AREAS.flatMap((a) => a.prefixos));
  const outras = catalogo.filter((p) => !conhecidos.has(prefixo(p.chave)));
  if (outras.length > 0) grupos.push({ area: "Outras", permissoes: outras });
  return grupos.filter((g) => g.permissoes.length > 0);
}
