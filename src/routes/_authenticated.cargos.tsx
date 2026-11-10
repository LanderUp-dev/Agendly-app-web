// @requisito RO-29 RE-15 RE-16
import { createFileRoute } from "@tanstack/react-router";
import CargosView from "@/views/app/Cargos/CargosView";

export const Route = createFileRoute("/_authenticated/cargos")({
  head: () => ({ meta: [{ title: "Cargos" }] }),
  component: CargosView,
});
