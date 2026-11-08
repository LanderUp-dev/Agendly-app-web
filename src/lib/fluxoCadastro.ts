/**
 * Ordem dos cadastros e navegação entre eles.
 *
 * Só navegação e apresentação: usa os `listar()` que já existem nos services,
 * sem mudar payloads nem chamadas de escrita.
 */
import { toast } from "sonner";
import {
  areasAtuacaoService,
  clientesService,
  funcionariosService,
  lojasService,
  servicosService,
} from "@/services/endpoints";

export type EtapaChave = "loja" | "area" | "funcionario" | "servico" | "cliente";

export interface Etapa {
  chave: EtapaChave;
  /** Texto do passo na lista "Primeiros passos". */
  titulo: string;
  /** Por que o passo vem nessa ordem. */
  motivo: string;
  cadastro: string;
  listar: () => Promise<unknown[]>;
}

/** Caminho mínimo até a agenda útil, na ordem de dependência. */
export const ETAPAS: Etapa[] = [
  {
    chave: "loja",
    titulo: "Cadastrar a loja",
    motivo: "Todos os outros cadastros pertencem a uma loja.",
    cadastro: "/cadastro-loja",
    listar: () => lojasService.listar(),
  },
  {
    chave: "area",
    titulo: "Criar uma área de atuação",
    motivo: "Cada serviço fica dentro de uma área, como Cabelo ou Barba.",
    cadastro: "/cadastro-area-atuacao",
    listar: () => areasAtuacaoService.listar(),
  },
  {
    chave: "funcionario",
    titulo: "Cadastrar um funcionário",
    motivo: "Cada funcionário vira uma coluna da agenda.",
    cadastro: "/cadastro-funcionario",
    listar: () => funcionariosService.listar(),
  },
  {
    chave: "servico",
    titulo: "Cadastrar um serviço",
    motivo: "É o que o cliente agenda, com preço e comissão.",
    cadastro: "/cadastro-servico",
    listar: () => servicosService.listar(),
  },
  {
    chave: "cliente",
    titulo: "Cadastrar um cliente",
    motivo: "Para marcar o primeiro horário.",
    cadastro: "/cadastro-cliente",
    listar: () => clientesService.listar(),
  },
];

/** Só aceita voltar para outro formulário de cadastro do próprio app. */
const ROTA_DE_CADASTRO = /^\/cadastro-[a-z-]+$/;

export interface Retorno {
  voltar?: string;
  campo?: string;
  novo?: string;
}

/** Lê `?voltar=&campo=&novo=` da URL atual (rotas internas rodam só no navegador). */
export function lerRetorno(): Retorno {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const voltar = p.get("voltar") ?? undefined;
  return {
    voltar: voltar && ROTA_DE_CADASTRO.test(voltar) ? voltar : undefined,
    campo: p.get("campo") ?? undefined,
    novo: p.get("novo") ?? undefined,
  };
}

/** Parâmetros do link "Cadastrar agora": de onde o usuário saiu e qual campo preencher na volta. */
export function buscaDeRetorno(campo: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  const origem = window.location.pathname;
  return ROTA_DE_CADASTRO.test(origem) ? { voltar: origem, campo } : {};
}

type Navegar = (opcoes: { to?: string; href?: string; replace?: boolean }) => unknown;

// O destino depois do login fica em lib/contexto.ts (destinoAposLogin), que também escolhe a loja.

/**
 * Depois de salvar um cadastro:
 * - se o usuário veio de outro formulário ("Cadastrar agora"), volta para ele
 *   com o item novo já selecionado;
 * - senão, vai para a listagem e, se o próximo passo da ordem ainda estiver
 *   vazio, mostra um aviso com o link.
 */
export async function concluirCadastro(opcoes: {
  navigate: Navegar;
  listagem: string;
  criado?: unknown;
  etapa?: EtapaChave;
}): Promise<void> {
  const { navigate, listagem, criado, etapa } = opcoes;
  const retorno = lerRetorno();

  if (retorno.voltar) {
    const id = (criado as { id?: unknown } | undefined)?.id;
    const busca = new URLSearchParams();
    if (retorno.campo) busca.set("campo", retorno.campo);
    if (id !== undefined && id !== null) busca.set("novo", String(id));
    const sufixo = busca.toString();
    navigate({ href: sufixo ? `${retorno.voltar}?${sufixo}` : retorno.voltar });
    return;
  }

  navigate({ to: listagem });
  if (!etapa) return;

  const indice = ETAPAS.findIndex((e) => e.chave === etapa);
  const proxima = ETAPAS[indice + 1];
  if (!proxima) return;

  try {
    const itens = await proxima.listar();
    if (Array.isArray(itens) && itens.length === 0) {
      toast.info(`Próximo passo: ${proxima.titulo.toLowerCase()}`, {
        description: proxima.motivo,
        duration: 10000,
        action: { label: "Cadastrar", onClick: () => navigate({ to: proxima.cadastro }) },
      });
    }
  } catch {
    // Sem aviso se a lista não carregar: o cadastro já foi salvo.
  }
}
