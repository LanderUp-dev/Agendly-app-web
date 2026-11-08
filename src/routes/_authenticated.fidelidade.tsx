// @requisito RO-27 RND-05
import { createFileRoute } from "@tanstack/react-router";
import FidelidadeView from "@/views/app/Fidelidade/FidelidadeView";

export const Route = createFileRoute("/_authenticated/fidelidade")({
  head: () => ({ meta: [{ title: "Fidelidade" }] }),
  component: FidelidadeView,
});
