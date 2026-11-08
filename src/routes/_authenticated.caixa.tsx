// @requisito RO-42 RE-06
import { createFileRoute } from "@tanstack/react-router";
import CaixaView from "@/views/app/Financeiro/CaixaView";

export const Route = createFileRoute("/_authenticated/caixa")({
  head: () => ({ meta: [{ title: "Caixa" }] }),
  component: CaixaView,
});
