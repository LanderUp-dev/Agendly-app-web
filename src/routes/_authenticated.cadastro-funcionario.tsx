import { createFileRoute } from "@tanstack/react-router";
import CadastroFuncionario from "@/views/app/Funcionario/CadastroFuncionario";

export const Route = createFileRoute("/_authenticated/cadastro-funcionario")({
  head: () => ({
    meta: [
      { title: "Cadastrar Funcionário" },
      { name: "description", content: "Cadastrar Funcionário - SaaS" },
    ],
  }),
  component: CadastroFuncionario,
});
