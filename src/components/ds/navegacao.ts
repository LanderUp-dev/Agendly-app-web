/**
 * Itens de navegação do app (navbar e menu).
 * - NAV_PRINCIPAL: o dia a dia, sempre visível na barra (desktop).
 * - GRUPOS_MENU: tudo, agrupado por assunto, no menu ☰. Os cadastros seguem a ordem
 *   de dependência: loja → áreas → funcionários → especialidades → serviços.
 * - Configurações da loja (trocar loja, plano, horários) ficam num grupo próprio no
 *   menu, montado no AppNavbar porque dependem da loja ativa.
 */
export interface ItemNav {
  to: string;
  rotulo: string;
}

export interface GrupoNav {
  titulo: string;
  itens: ItemNav[];
}

const AGENDA = { to: "/agenda", rotulo: "Agenda" };
const CAIXA = { to: "/caixa", rotulo: "Caixa" };
const CLIENTES = { to: "/listagem-clientes", rotulo: "Clientes" };
const PAINEL = { to: "/painel", rotulo: "Painel" };

export const NAV_PRINCIPAL: ItemNav[] = [AGENDA, CAIXA, CLIENTES, PAINEL];

export const GRUPOS_MENU: GrupoNav[] = [
  {
    titulo: "Atendimento",
    itens: [AGENDA, CAIXA, CLIENTES, { to: "/fidelidade", rotulo: "Fidelidade" }],
  },
  {
    titulo: "Financeiro",
    itens: [
      PAINEL,
      { to: "/despesas", rotulo: "Despesas" },
      { to: "/recebimentos", rotulo: "Recebimentos" },
      { to: "/salarios", rotulo: "Salários" },
      { to: "/listagem-cobrancistas", rotulo: "Cobrancistas" },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      { to: "/listagem-lojas", rotulo: "Lojas" },
      { to: "/listagem-areas-atuacao", rotulo: "Áreas" },
      { to: "/listagem-funcionarios", rotulo: "Funcionários" },
      { to: "/listagem-areas-funcionario", rotulo: "Especialidades" },
      { to: "/listagem-servicos", rotulo: "Serviços" },
    ],
  },
  {
    titulo: "Equipe e acesso",
    itens: [
      { to: "/listagem-equipes", rotulo: "Equipes" },
      { to: "/cargos", rotulo: "Cargos e permissões" },
    ],
  },
];

/** Tudo o que está no menu e não está na barra (compatibilidade). */
export const NAV_MAIS: ItemNav[] = GRUPOS_MENU.flatMap((g) => g.itens).filter(
  (item) => !NAV_PRINCIPAL.includes(item),
);
