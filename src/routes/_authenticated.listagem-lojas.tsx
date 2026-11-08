import { createFileRoute } from "@tanstack/react-router";
import ListagemLoja from "@/views/app/Loja/ListagemLoja";

export const Route = createFileRoute("/_authenticated/listagem-lojas")({
  head: () => ({
    meta: [
      { title: "Listagem de Lojas" },
      { name: "description", content: "Listagem de Lojas - SaaS" },
    ],
  }),
  component: ListagemLoja,
});
