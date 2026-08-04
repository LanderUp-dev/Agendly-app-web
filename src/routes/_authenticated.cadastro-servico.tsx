import { createFileRoute } from "@tanstack/react-router";
import CadastroServico from "@/views/app/Servico/CadastroServico";

export const Route = createFileRoute("/_authenticated/cadastro-servico")({
  head: () => ({
    meta: [
      { title: "Cadastrar Serviço" },
      { name: "description", content: "Cadastrar Serviço - SaaS" },
    ],
  }),
  component: CadastroServico,
});
