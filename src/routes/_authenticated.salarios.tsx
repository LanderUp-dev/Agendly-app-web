// @requisito RO-01 RO-02 RO-03 RO-08
import { createFileRoute } from "@tanstack/react-router";
import SalariosView from "@/views/app/Salario/SalariosView";

export const Route = createFileRoute("/_authenticated/salarios")({
  head: () => ({ meta: [{ title: "Salários" }] }),
  component: SalariosView,
});
