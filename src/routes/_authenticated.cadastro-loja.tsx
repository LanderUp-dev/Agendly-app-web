import { createFileRoute } from "@tanstack/react-router";
import CadastroLoja from "@/views/app/Loja/CadastroLoja";

export const Route = createFileRoute("/_authenticated/cadastro-loja")({
  head: () => ({
    meta: [
      { title: "Cadastrar Loja" },
      { name: "description", content: "Cadastrar Loja - SaaS" },
    ],
  }),
  component: CadastroLoja,
});
