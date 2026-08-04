// @ts-nocheck
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { estaAutenticado } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  // Skip SSR: a checagem de auth depende de localStorage, que só existe no browser.
  ssr: false,
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!estaAutenticado()) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => <Outlet />,
});
