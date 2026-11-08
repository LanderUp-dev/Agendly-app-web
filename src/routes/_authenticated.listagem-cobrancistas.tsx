import { createFileRoute } from "@tanstack/react-router";
import ListagemCobrancista from "@/views/app/Cobrancista/ListagemCobrancista";

export const Route = createFileRoute("/_authenticated/listagem-cobrancistas")({
  head: () => ({
    meta: [
      { title: "Listagem de Cobrancistas" },
      { name: "description", content: "Listagem de Cobrancistas - SaaS" },
    ],
  }),
  component: ListagemCobrancista,
});
