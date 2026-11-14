// @requisito RO-44
import { createFileRoute } from "@tanstack/react-router";
import AgendamentoOnline from "@/views/app/Loja/AgendamentoOnline";

export const Route = createFileRoute("/_authenticated/agendamento-online")({
  head: () => ({ meta: [{ title: "Agendamento online" }] }),
  component: AgendamentoOnline,
});
