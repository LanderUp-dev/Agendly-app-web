import { createFileRoute } from "@tanstack/react-router";
import CadastroCliente from "@/views/app/Cliente/CadastroCliente";

interface BuscaCliente {
  /** Com id: edição do cliente. Sem id: novo cliente. */
  id?: number;
  /** "Cadastrar agora" vindo de outro formulário (lib/fluxoCadastro). */
  voltar?: string;
  campo?: string;
}

export const Route = createFileRoute("/_authenticated/cadastro-cliente")({
  head: () => ({
    meta: [{ title: "Cliente" }, { name: "description", content: "Cadastrar ou editar cliente" }],
  }),
  validateSearch: (busca: Record<string, unknown>): BuscaCliente => {
    const id = Number(busca.id);
    const texto = (v: unknown) => (typeof v === "string" && v ? v : undefined);
    return {
      id: Number.isInteger(id) && id > 0 ? id : undefined,
      voltar: texto(busca.voltar),
      campo: texto(busca.campo),
    };
  },
  component: PaginaCliente,
});

function PaginaCliente() {
  const { id } = Route.useSearch();
  // key: abrir outro cliente recomeça o formulário
  return <CadastroCliente key={id ?? 0} id={id ?? 0} />;
}
