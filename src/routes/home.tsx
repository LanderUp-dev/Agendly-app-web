import { createFileRoute } from "@tanstack/react-router";
import Home from "@/views/auth/Home/HomeView";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Agendly — agenda para salões, barbearias e estúdios" },
      {
        name: "description",
        content:
          "Agenda do dia por profissional, clientes, serviços e equipe da sua loja em um só lugar.",
      },
    ],
  }),
  component: Home,
});
