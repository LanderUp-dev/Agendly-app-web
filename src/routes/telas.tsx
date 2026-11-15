import { createFileRoute, redirect } from "@tanstack/react-router";
import TelasView from "@/views/dev/TelasView";

/** Lista de todas as telas: só em desenvolvimento. No build de produção, volta para a home. */
export const Route = createFileRoute("/telas")({
  head: () => ({
    meta: [{ title: "Todas as telas (dev)" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: () => {
    if (!import.meta.env.DEV) throw redirect({ to: "/" });
  },
  component: TelasView,
});
