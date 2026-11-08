// @requisito RO-40
import { createFileRoute } from "@tanstack/react-router";
import RecuperarSenhaView from "@/views/auth/RecuperarSenha/RecuperarSenhaView";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha" },
      { name: "description", content: "Recuperar senha - Agendly" },
    ],
  }),
  component: RecuperarSenhaView,
});
