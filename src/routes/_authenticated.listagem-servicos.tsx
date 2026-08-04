import { createFileRoute } from "@tanstack/react-router";
import ListagemServico from "@/views/app/Servico/ListagemServico";

export const Route = createFileRoute("/_authenticated/listagem-servicos")({
  head: () => ({
    meta: [
      { title: "Listagem de Serviços" },
      { name: "description", content: "Listagem de Serviços - SaaS" },
    ],
  }),
  component: ListagemServico,
});
