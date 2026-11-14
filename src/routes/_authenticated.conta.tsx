import { createFileRoute } from "@tanstack/react-router";
import MinhaConta from "@/views/app/Conta/MinhaConta";

export const Route = createFileRoute("/_authenticated/conta")({
  head: () => ({ meta: [{ title: "Minha conta" }] }),
  component: MinhaConta,
});
