import { createFileRoute } from "@tanstack/react-router";
import ListagemAreaAtuacao from "@/views/app/AreaAtuacao/ListagemAreaAtuacao";

export const Route = createFileRoute("/_authenticated/listagem-areas-atuacao")({
  head: () => ({
    meta: [
      { title: "Listagem de Áreas de Atuação" },
      { name: "description", content: "Listagem de Áreas de Atuação - SaaS" },
    ],
  }),
  component: ListagemAreaAtuacao,
});
