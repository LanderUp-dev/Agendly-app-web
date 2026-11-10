import { createFileRoute } from "@tanstack/react-router";
import AgendaView from "@/views/app/Agenda/AgendaView";

export const Route = createFileRoute("/_authenticated/agenda")({
  head: () => ({
    meta: [{ title: "Agenda" }, { name: "description", content: "Agenda - SaaS" }],
  }),
  // ?data=AAAA-MM-DD abre a agenda nesse dia (links do sininho). Valor inválido é ignorado.
  validateSearch: (busca: Record<string, unknown>): { data?: string } =>
    typeof busca.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(busca.data)
      ? { data: busca.data }
      : {},
  component: AgendaView,
});
