import { createFileRoute } from "@tanstack/react-router";
import CadastroCobrancista from "@/views/app/Cobrancista/CadastroCobrancista";

export const Route = createFileRoute("/_authenticated/cadastro-cobrancista")({
  head: () => ({
    meta: [
      { title: "Cadastrar Cobrancista" },
      { name: "description", content: "Cadastrar Cobrancista - SaaS" },
    ],
  }),
  component: CadastroCobrancista,
});
