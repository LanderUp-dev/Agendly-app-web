import { createFileRoute } from "@tanstack/react-router";
import AjudaView from "@/views/app/Ajuda/AjudaView";

export const Route = createFileRoute("/_authenticated/ajuda")({
  head: () => ({ meta: [{ title: "Ajuda e tutoriais" }] }),
  component: AjudaView,
});
