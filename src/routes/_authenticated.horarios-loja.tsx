import { createFileRoute } from "@tanstack/react-router";
import HorariosLoja from "@/views/app/Loja/HorariosLoja";

export const Route = createFileRoute("/_authenticated/horarios-loja")({
  head: () => ({ meta: [{ title: "Horários da loja" }] }),
  component: HorariosLoja,
});
