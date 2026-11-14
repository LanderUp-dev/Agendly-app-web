// @requisito RO-37
import { createFileRoute } from "@tanstack/react-router";
import ConfirmarHorarioView from "@/views/auth/Confirmar/ConfirmarHorarioView";

/** Link "Sim, confirmo" enviado ao cliente no WhatsApp. Página pública, sem login. */
export const Route = createFileRoute("/confirmar/$token")({
  head: () => ({
    meta: [
      { title: "Confirmar horário" },
      { name: "description", content: "Confirme seu horário com um toque." },
      // O link é pessoal: não deve ir para buscadores.
      { name: "robots", content: "noindex, nofollow" },
      // Não repassa o endereço (com o código) para outros sites.
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: function ConfirmarRota() {
    const { token } = Route.useParams();
    return <ConfirmarHorarioView token={token} />;
  },
});
