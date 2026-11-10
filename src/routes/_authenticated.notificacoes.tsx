// @requisito RO-43
import { createFileRoute } from "@tanstack/react-router";
import NotificacoesView from "@/views/app/Notificacoes/NotificacoesView";

export const Route = createFileRoute("/_authenticated/notificacoes")({
  head: () => ({ meta: [{ title: "Avisos" }] }),
  component: NotificacoesView,
});
