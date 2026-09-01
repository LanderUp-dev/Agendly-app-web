import { createFileRoute } from "@tanstack/react-router";
import PoliticasDePivacidade from "@/views/auth/Register/PoliticasDePivacidade";

export const Route = createFileRoute("/politicas-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade" },
      { name: "description", content: "Política de Privacidade - Agendly" },
    ],
  }),
  component: PoliticasDePivacidade,
});