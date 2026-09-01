import { createFileRoute } from "@tanstack/react-router";
import TermosDeUso from "@/views/auth/Register/TermosDeUso";

export const Route = createFileRoute("/termos-de-uso")({
  head: () => ({
    meta: [
      { title: "Termos de Uso" },
      { name: "description", content: "Termos de Uso - Agendly" },
    ],
  }),
  component: TermosDeUso,
});