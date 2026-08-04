import { createFileRoute } from "@tanstack/react-router";
import ListagemFuncionario from "@/views/app/Funcionario/ListagemFuncionario";

export const Route = createFileRoute("/_authenticated/listagem-funcionarios")({
  head: () => ({
    meta: [
      { title: "Listagem de Funcionários" },
      { name: "description", content: "Listagem de Funcionários - SaaS" },
    ],
  }),
  component: ListagemFuncionario,
});
