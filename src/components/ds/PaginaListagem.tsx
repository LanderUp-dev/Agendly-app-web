import React from "react";
import { Plus } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ButtonLink } from "./Button";
import { DataTable, type Coluna } from "./DataTable";
import { PageHeader } from "./Layout";
import { podeAcessar } from "@/lib/permissoes";
import { useCarregar } from "@/hooks/useCarregar";

interface PaginaListagemProps<T> {
  titulo: string;
  descricao: string;
  novo?: { to: string; rotulo: string };
  buscar: () => Promise<T[]>;
  colunas: Coluna<T>[];
  chaveItem: (item: T) => string | number;
  filtrar?: (item: T, termo: string) => boolean;
  buscaPlaceholder: string;
  /** Ex.: "Carregando clientes..." (mostrado após 2 s). */
  contextoCarregando: string;
  vazio: { titulo: string; texto?: React.ReactNode };
  aviso?: React.ReactNode;
}

/** Página padrão de listagem: PageHeader + DataTable com carregamento e erro. */
export function PaginaListagem<T>({
  titulo,
  descricao,
  novo,
  buscar,
  colunas,
  chaveItem,
  filtrar,
  buscaPlaceholder,
  contextoCarregando,
  vazio,
  aviso,
}: PaginaListagemProps<T>) {
  const { dados, carregando, erro, recarregar } = useCarregar<T[]>(buscar, []);
  // Sem permissão para cadastrar: some o botão (o backend também barra).
  const podeCriar = !!novo && podeAcessar(novo.to);

  const botaoNovo = podeCriar && novo && (
    <ButtonLink
      to={novo.to}
      icone={<Plus size={18} strokeWidth={1.75} aria-hidden="true" />}
      data-cy="botao-novo"
    >
      {novo.rotulo}
    </ButtonLink>
  );

  return (
    <Layout>
      <PageHeader titulo={titulo} descricao={descricao} acoes={botaoNovo} />
      {aviso}
      <DataTable<T>
        rotulo={titulo}
        colunas={colunas}
        itens={dados}
        chaveItem={chaveItem}
        carregando={carregando}
        erro={erro}
        onTentarNovamente={recarregar}
        contextoCarregando={contextoCarregando}
        buscaPlaceholder={buscaPlaceholder}
        filtrar={filtrar}
        vazio={{
          ...vazio,
          acao: podeCriar && novo && (
            <ButtonLink
              to={novo.to}
              variante="secundario"
              icone={<Plus size={18} strokeWidth={1.75} aria-hidden="true" />}
            >
              {novo.rotulo}
            </ButtonLink>
          ),
        }}
      />
    </Layout>
  );
}

export default PaginaListagem;
