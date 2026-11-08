// @requisito RO-42 RE-06
import { createFileRoute } from "@tanstack/react-router";
import PainelLoja from "@/views/app/Financeiro/PainelLoja";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Painel da loja" }] }),
  component: PainelLoja,
});
