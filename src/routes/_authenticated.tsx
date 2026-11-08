// @requisito RO-34 RS-02
import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { estaAutenticado, tokenTemContexto } from "@/lib/auth";
import { ROTA_SELECIONAR_LOJA, rotaPrecisaDeLoja } from "@/lib/contexto";
import { podeAcessar, telaInicialPermitida } from "@/lib/permissoes";

export const Route = createFileRoute("/_authenticated")({
  // Skip SSR: a checagem de auth depende de localStorage, que só existe no browser.
  ssr: false,
  beforeLoad: ({ location }) => {
    if (typeof window === "undefined") return;
    if (!estaAutenticado()) {
      throw redirect({ to: "/login" });
    }
    // Telas de negócio só funcionam com loja selecionada (token de contexto).
    if (!tokenTemContexto() && rotaPrecisaDeLoja(location.pathname)) {
      throw redirect({ to: ROTA_SELECIONAR_LOJA });
    }
    // Cargo sem permissão para esta tela (o backend também barra): volta para uma tela permitida.
    if (tokenTemContexto() && !podeAcessar(location.pathname)) {
      throw redirect({ to: telaInicialPermitida() });
    }
  },
  component: () => <Outlet />,
});
