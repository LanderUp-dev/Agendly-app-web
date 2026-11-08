import React from "react";
import { AppNavbar } from "./AppNavbar";

/** Estrutura padrão das páginas internas: Navbar + conteúdo com largura máxima. */
export function AppPagina({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-pagina">
      <a href="#conteudo" className="pular-para-conteudo">
        Pular para o conteúdo
      </a>
      <AppNavbar />
      <main id="conteudo" className="app-conteudo" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export default AppPagina;
