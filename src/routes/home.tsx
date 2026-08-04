import { createFileRoute } from "@tanstack/react-router";
import Home from "@/views/auth/Home/HomeView";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home" },
      { name: "description", content: "Home - SaaS" },
    ],
  }),
  component: Home,
});
