import { createFileRoute } from "@tanstack/react-router";
import RegisterView from "@/views/auth/Register/RegisterView";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Cadastro" },
      { name: "description", content: "Cadastro - SaaS" },
    ],
  }),
  component: RegisterView,
});
