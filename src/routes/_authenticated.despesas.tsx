// @requisito RE-08
import { createFileRoute } from "@tanstack/react-router";
import DespesasView from "@/views/app/Despesa/DespesasView";

export const Route = createFileRoute("/_authenticated/despesas")({
  head: () => ({ meta: [{ title: "Despesas" }] }),
  component: DespesasView,
});
