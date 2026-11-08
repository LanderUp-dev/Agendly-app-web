import { createFileRoute } from "@tanstack/react-router";
import CadastroAreaAtuacao from "@/views/app/AreaAtuacao/CadastroAreaAtuacao";

export const Route = createFileRoute("/_authenticated/cadastro-area-atuacao")({
  head: () => ({
    meta: [
      { title: "Cadastrar Área de Atuação" },
      { name: "description", content: "Cadastrar Área de Atuação - SaaS" },
    ],
  }),
  component: CadastroAreaAtuacao,
});
