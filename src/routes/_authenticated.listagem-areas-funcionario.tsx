import { createFileRoute } from "@tanstack/react-router";
import ListagemAreaFuncionario from "@/views/app/AreaFuncionario/ListagemAreaFuncionario";

export const Route = createFileRoute("/_authenticated/listagem-areas-funcionario")({
  head: () => ({
    meta: [
      { title: "Listagem de Especialidades" },
      { name: "description", content: "Listagem de Especialidades - SaaS" },
    ],
  }),
  component: ListagemAreaFuncionario,
});
