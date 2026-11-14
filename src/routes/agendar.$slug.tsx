// @requisito RO-44
import { createFileRoute } from "@tanstack/react-router";
import AgendarView from "@/views/auth/Agendar/AgendarView";

/** Página pública de agendamento da loja (o link que a loja divulga). Sem login. */
export const Route = createFileRoute("/agendar/$slug")({
  head: () => ({
    meta: [
      { title: "Agendar horário" },
      { name: "description", content: "Escolha o serviço e marque um horário livre." },
    ],
  }),
  component: function AgendarRota() {
    const { slug } = Route.useParams();
    return <AgendarView slug={slug} />;
  },
});
