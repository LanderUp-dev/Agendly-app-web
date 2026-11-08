import { createFileRoute } from "@tanstack/react-router";
import ListagemEquipe from "@/views/app/Equipe/ListagemEquipe";

export const Route = createFileRoute("/_authenticated/listagem-equipes")({
  head: () => ({
    meta: [
      { title: "Listagem de Equipes" },
      { name: "description", content: "Listagem de Equipes - SaaS" },
    ],
  }),
  component: ListagemEquipe,
});
