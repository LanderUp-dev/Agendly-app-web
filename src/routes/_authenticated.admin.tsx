import { createFileRoute } from "@tanstack/react-router";
import AdminLojas from "@/views/app/Admin/AdminLojas";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração da plataforma" }] }),
  component: AdminLojas,
});
