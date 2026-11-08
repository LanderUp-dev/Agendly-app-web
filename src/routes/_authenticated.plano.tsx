import { createFileRoute } from "@tanstack/react-router";
import PlanoLoja from "@/views/app/Loja/PlanoLoja";

export const Route = createFileRoute("/_authenticated/plano")({
  head: () => ({ meta: [{ title: "Plano da loja" }] }),
  component: PlanoLoja,
});
