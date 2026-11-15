import { createFileRoute, redirect } from "@tanstack/react-router";
import TelasView from "@/views/dev/TelasView";
import { LISTA_TELAS_LIGADA } from "@/lib/listaTelas";

/** Lista de todas as telas: só com a chave ligada (lib/listaTelas). Senão, volta para a home. */
export const Route = createFileRoute("/telas")({
  head: () => ({
    meta: [{ title: "Todas as telas (dev)" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: () => {
    if (!LISTA_TELAS_LIGADA) throw redirect({ to: "/" });
  },
  component: TelasView,
});
