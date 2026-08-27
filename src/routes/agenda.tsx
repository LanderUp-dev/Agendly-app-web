import { createFileRoute } from "@tanstack/react-router";
import AgendaView from "@/views/app/Agenda/AgendaView";

export const Route = createFileRoute("/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda" },
      { name: "description", content: "Agenda - SaaS" },
    ],
  }),
  component: AgendaView,
});
