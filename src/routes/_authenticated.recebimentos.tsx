// @requisito RE-09
import { createFileRoute } from "@tanstack/react-router";
import RecebimentosView from "@/views/app/Recebimento/RecebimentosView";

export const Route = createFileRoute("/_authenticated/recebimentos")({
  head: () => ({ meta: [{ title: "Recebimentos" }] }),
  component: RecebimentosView,
});
