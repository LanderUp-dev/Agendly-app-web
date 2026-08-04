import { createFileRoute } from "@tanstack/react-router";
import ListagemCliente from "@/views/app/Cliente/ListagemCliente";

export const Route = createFileRoute("/_authenticated/listagem-clientes")({
  head: () => ({
    meta: [
      { title: "Listagem de Clientes" },
      { name: "description", content: "Listagem de Clientes - SaaS" },
    ],
  }),
  component: ListagemCliente,
});
