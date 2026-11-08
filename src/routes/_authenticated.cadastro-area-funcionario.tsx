import { createFileRoute } from "@tanstack/react-router";
import CadastroAreaFuncionario from "@/views/app/AreaFuncionario/CadastroAreaFuncionario";

export const Route = createFileRoute("/_authenticated/cadastro-area-funcionario")({
  head: () => ({
    meta: [
      { title: "Alocar Funcionário em Área" },
      { name: "description", content: "Alocar Funcionário em Área - SaaS" },
    ],
  }),
  component: CadastroAreaFuncionario,
});
