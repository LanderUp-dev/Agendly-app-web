import { createFileRoute } from "@tanstack/react-router";
import CadastroCliente from "@/views/app/Cliente/CadastroCliente";

export const Route = createFileRoute("/_authenticated/cadastro-cliente")({
  head: () => ({
    meta: [
      { title: "Cadastrar Cliente" },
      { name: "description", content: "Cadastrar Cliente - SaaS" },
    ],
  }),
  component: CadastroCliente,
});
