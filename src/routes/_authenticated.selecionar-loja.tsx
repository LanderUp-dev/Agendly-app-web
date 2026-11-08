import { createFileRoute } from "@tanstack/react-router";
import SelecionarLoja from "@/views/app/Loja/SelecionarLoja";

export const Route = createFileRoute("/_authenticated/selecionar-loja")({
  head: () => ({
    meta: [
      { title: "Escolher loja" },
      { name: "description", content: "Escolha a loja em que você vai trabalhar" },
    ],
  }),
  component: SelecionarLoja,
});
