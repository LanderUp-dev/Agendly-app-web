import { createFileRoute } from "@tanstack/react-router";
import LoginView from "@/views/auth/Login/LoginView";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login" },
      { name: "description", content: "Login - SaaS" },
    ],
  }),
  component: LoginView,
});
