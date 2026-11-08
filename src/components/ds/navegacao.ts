/**
 * Itens de navegação do app (navbar e menu).
 * Depois da Agenda, a ordem segue a dependência dos cadastros:
 * loja → áreas → funcionários → serviços → clientes.
 */
export const NAV_PRINCIPAL = [
  { to: "/agenda", rotulo: "Agenda" },
  { to: "/caixa", rotulo: "Caixa" },
  { to: "/painel", rotulo: "Painel" },
  { to: "/listagem-lojas", rotulo: "Lojas" },
  { to: "/listagem-areas-atuacao", rotulo: "Áreas" },
  { to: "/listagem-funcionarios", rotulo: "Funcionários" },
  { to: "/listagem-servicos", rotulo: "Serviços" },
  { to: "/listagem-clientes", rotulo: "Clientes" },
];

export const NAV_MAIS = [
  { to: "/listagem-areas-funcionario", rotulo: "Especialidades" },
  { to: "/despesas", rotulo: "Despesas" },
  { to: "/recebimentos", rotulo: "Recebimentos" },
  { to: "/salarios", rotulo: "Salários" },
  { to: "/fidelidade", rotulo: "Fidelidade" },
  { to: "/listagem-cobrancistas", rotulo: "Cobrancistas" },
  { to: "/listagem-equipes", rotulo: "Equipes" },
];
