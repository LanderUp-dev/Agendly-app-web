// @requisito RO-04 RO-26
import { createFileRoute } from "@tanstack/react-router";
import HistoricoClienteView from "@/views/app/Fidelidade/HistoricoClienteView";

interface BuscaHistorico {
  id: number;
}

export const Route = createFileRoute("/_authenticated/cliente-historico")({
  head: () => ({ meta: [{ title: "Histórico do cliente" }] }),
  validateSearch: (busca: Record<string, unknown>): BuscaHistorico => {
    const id = Number(busca.id);
    return { id: Number.isInteger(id) && id > 0 ? id : 0 };
  },
  component: PaginaHistorico,
});

function PaginaHistorico() {
  const { id } = Route.useSearch();
  // key: trocar de cliente recomeça a paginação
  return <HistoricoClienteView key={id} id={id} />;
}
