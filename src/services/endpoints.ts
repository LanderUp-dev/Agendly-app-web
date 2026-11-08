/* eslint-disable @typescript-eslint/no-explicit-any --
   As respostas do backend não são tipadas (ModelMapper e, em /equipes, a própria entidade);
   a normalização abaixo é o ponto que converte esses dados para formatos conhecidos. */
import api from "@/config/axios";
import type { AuthResponse } from "@/types/auth";

type Id = string | number;

export interface CrudService<T = any> {
  listar: () => Promise<T[]>;
  buscar: (id: Id) => Promise<T>;
  criar: (payload: any) => Promise<T>;
  atualizar: (id: Id, payload: any) => Promise<T>;
  remover: (id: Id) => Promise<unknown>;
}

/** Aceita lista simples ou página do Spring ({ content: [...] }). */
export const normalizarLista = <T = any>(dados: unknown): T[] => {
  if (Array.isArray(dados)) return dados as T[];
  const content = (dados as { content?: unknown } | null)?.content;
  return Array.isArray(content) ? (content as T[]) : [];
};

const caminho = (recurso: string, id?: Id) =>
  id === undefined ? `/${recurso}` : `/${recurso}/${encodeURIComponent(String(id))}`;

const crud = <T = any>(recurso: string): CrudService<T> => ({
  listar: () => api.get(caminho(recurso)).then((r) => normalizarLista<T>(r.data)),
  buscar: (id) => api.get<T>(caminho(recurso, id)).then((r) => r.data),
  criar: (payload) => api.post<T>(caminho(recurso), payload).then((r) => r.data),
  atualizar: (id, payload) => api.put<T>(caminho(recurso, id), payload).then((r) => r.data),
  remover: (id) => api.delete(caminho(recurso, id)).then((r) => r.data),
});

export const clientesService = crud("clientes");
export const lojasService = crud("lojas");
export const servicosService = crud("servicos");
export const funcionariosService = crud("funcionarios");
export const cobrancistasService = crud("cobrancistas");
export const usuariosService = crud("usuarios");
/** O controller do backend está mapeado em /api/v1/AreasAtuacoes. */
export const areasAtuacaoService = crud("AreasAtuacoes");

// ---------------------------------------------------------------------------
// Equipes: GET /equipes devolve os membros da loja ativa (EquipeDTO plano);
// a normalização aceita também o formato antigo (entidade aninhada).
// ---------------------------------------------------------------------------
export interface EquipeLista {
  id: string;
  idUsuario?: number;
  nomeUsuario: string;
  idLoja?: number;
  nomeLoja: string;
  nomeCargo: string;
}

const nomeCompleto = (p: any) => [p?.nome, p?.sobrenome].filter(Boolean).join(" ");

export const normalizarEquipe = (e: any): EquipeLista => ({
  id: String(e?.id ?? ""),
  idUsuario: e?.idUsuario ?? e?.usuario?.id,
  nomeUsuario: e?.nomeUsuario ?? nomeCompleto(e?.usuario) ?? "",
  idLoja: e?.idLoja ?? e?.loja?.id,
  nomeLoja: e?.nomeLoja ?? e?.loja?.nome ?? "",
  nomeCargo: e?.nomeCargo ?? e?.cargo?.nome ?? "",
});

const equipesCrud = crud("equipes");
export const equipesService: CrudService<EquipeLista> = {
  ...equipesCrud,
  listar: () => equipesCrud.listar().then((lista) => lista.map(normalizarEquipe)),
};

// ---------------------------------------------------------------------------
// Agendamentos: o DTO usa data yyyy-MM-dd e horários HH:mm:ss; a agenda
// trabalha com dd/MM/yyyy e HH:mm.
// ---------------------------------------------------------------------------
export const COR_PADRAO_AGENDAMENTO = "#16a34a";

export interface AgendamentoAgenda {
  id: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  profissional: string;
  cliente: string;
  servico: string;
  cor: string;
  status?: string;
  idFuncionario?: number;
  idCliente?: number;
  idServico?: number;
  idLoja?: number;
  /** Para o link de confirmação pelo WhatsApp. */
  celularCliente?: string;
  nomeLoja?: string;
}

const isoParaBR = (data?: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data ?? "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : (data ?? "");
};
const horaCurta = (hora?: string) => (hora ?? "").slice(0, 5);

export const agendamentoParaAgenda = (a: any): AgendamentoAgenda => ({
  id: a?.id,
  data: isoParaBR(a?.data),
  horaInicio: horaCurta(a?.horarioInicio),
  horaFim: horaCurta(a?.horarioFim),
  profissional: a?.nomeFuncionario ?? "",
  cliente: a?.nomeCliente ?? "",
  servico: a?.nomeServico ?? "",
  cor: a?.cor || COR_PADRAO_AGENDAMENTO,
  status: a?.status,
  idFuncionario: a?.idFuncionario,
  idCliente: a?.idCliente,
  idServico: a?.idServico,
  idLoja: a?.idLoja,
  celularCliente: a?.celularCliente ?? undefined,
  nomeLoja: a?.nomeLoja ?? undefined,
});

const agendamentosCrud = crud("agendamentos");
export const agendamentosService = {
  ...agendamentosCrud,
  listar: () => agendamentosCrud.listar().then((lista) => lista.map(agendamentoParaAgenda)),
  /** CONFIRMADO, CANCELADO, AGENDADO… (PATCH /agendamentos/{id}/status). */
  alterarStatus: (id: number, status: string) =>
    api.patch(`/agendamentos/${id}/status`, { status }).then((r) => agendamentoParaAgenda(r.data)),
};

// ---------------------------------------------------------------------------
// Área x Funcionário: o backend não expõe controller próprio. A listagem é
// montada a partir de GET /funcionarios (campo `area` de cada funcionário).
// Não há como criar/remover vínculos pela API hoje.
// ---------------------------------------------------------------------------
export interface AreaFuncionarioLista {
  id: string;
  idFuncionario: number;
  nomeFuncionario: string;
  idArea: number;
  nomeArea: string;
}

export const areasFuncionarioService = {
  listar: (): Promise<AreaFuncionarioLista[]> =>
    funcionariosService.listar().then((funcionarios) =>
      funcionarios.flatMap((f: any) =>
        normalizarLista(f?.area).map((a: any) => ({
          id: `${f.id}-${a.id}`,
          idFuncionario: f.id,
          nomeFuncionario: nomeCompleto(f),
          idArea: a.id,
          nomeArea: a?.nome ?? "",
        })),
      ),
    ),
};

export const authService = {
  loginEmailSenha: (email: string, senha: string) =>
    api.post<AuthResponse>("/auth/login", { email, senha }).then((r) => r.data),
};
