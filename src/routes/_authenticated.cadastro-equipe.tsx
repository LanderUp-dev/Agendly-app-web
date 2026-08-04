import { createFileRoute } from "@tanstack/react-router";
import CadastroEquipe from "@/views/app/Equipe/CadastroEquipe";

export const Route = createFileRoute("/_authenticated/cadastro-equipe")({
  head: () => ({
    meta: [
      { title: "Vincular Equipe à Loja" },
      { name: "description", content: "Vincular Equipe à Loja - SaaS" },
    ],
  }),
  component: CadastroEquipe,
});
