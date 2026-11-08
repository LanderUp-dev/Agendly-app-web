import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Moon, Store, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import { NAV_MAIS, NAV_PRINCIPAL } from "./navegacao";
import { obterUsuario, obterLojaAtiva, limparSessao } from "@/lib/auth";
import { podeAcessar } from "@/lib/permissoes";
import { adminService } from "@/services/acesso";
import { ROTA_SELECIONAR_LOJA } from "@/lib/contexto";
import { useTheme } from "@/context/ThemeContext";

interface AppNavbarProps {
  /** Conteúdo limitado à largura máxima (páginas) ou largura total (Agenda). */
  contido?: boolean;
}

/**
 * Navbar única do app: 64 px (desktop) / 56 px (mobile), logo de 24–32 px
 * alinhado à mesma margem lateral do conteúdo.
 */
export function AppNavbar({ contido = true }: AppNavbarProps) {
  const navigate = useNavigate();
  const usuario = obterUsuario();
  const loja = obterLojaAtiva();
  const { theme, toggleTheme } = useTheme() as { theme: string; toggleTheme: () => void };
  const [menuAberto, setMenuAberto] = useState(false);
  const [ehAdmin, setEhAdmin] = useState(false);

  useEffect(() => {
    adminService
      .souAdmin()
      .then(setEhAdmin)
      .catch(() => setEhAdmin(false));
  }, []);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    const onClique = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClique);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClique);
    };
  }, [menuAberto]);

  const sair = () => {
    limparSessao();
    navigate({ to: "/login" });
  };

  const escuro = theme !== "light";

  return (
    <header className="app-navbar" data-cy="navbar">
      <div className={`app-navbar__interno ${contido ? "app-navbar__interno--contido" : ""}`}>
        <Link to="/agenda" aria-label="Agendly — ir para a agenda" className="logo-link">
          <Logo titulo="" />
        </Link>

        <nav className="app-navbar__nav" aria-label="Principal">
          {NAV_PRINCIPAL.filter((item) => podeAcessar(item.to)).map((item) => (
            <Link key={item.to} to={item.to} className="app-navbar__link">
              {item.rotulo}
            </Link>
          ))}
        </nav>

        <div className="app-navbar__acoes">
          <div className="menu" ref={menuRef}>
            <button
              type="button"
              className="btn btn-fantasma btn-icone"
              aria-expanded={menuAberto}
              aria-controls="menu-navegacao"
              aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
              onClick={() => setMenuAberto((v) => !v)}
              data-cy="menu-navegacao"
            >
              {menuAberto ? (
                <X size={20} strokeWidth={1.75} />
              ) : (
                <Menu size={20} strokeWidth={1.75} />
              )}
            </button>
            {menuAberto && (
              <div id="menu-navegacao" className="menu__painel" role="menu">
                <p className="menu__grupo">Loja</p>
                <Link
                  to={ROTA_SELECIONAR_LOJA}
                  role="menuitem"
                  className="menu__item"
                  onClick={() => setMenuAberto(false)}
                  data-cy="menu-trocar-loja"
                >
                  {loja ? `Trocar loja (atual: ${loja.nomeLoja})` : "Escolher loja"}
                </Link>
                {loja && (
                  <Link
                    to="/plano"
                    role="menuitem"
                    className="menu__item"
                    onClick={() => setMenuAberto(false)}
                    data-cy="menu-plano"
                  >
                    Plano da loja
                  </Link>
                )}
                {loja && (
                  <Link
                    to="/horarios-loja"
                    role="menuitem"
                    className="menu__item"
                    onClick={() => setMenuAberto(false)}
                    data-cy="menu-horarios"
                  >
                    Horários da loja
                  </Link>
                )}
                {ehAdmin && (
                  <>
                    <p className="menu__grupo">Plataforma</p>
                    <Link
                      to="/admin"
                      role="menuitem"
                      className="menu__item"
                      onClick={() => setMenuAberto(false)}
                      data-cy="menu-admin"
                    >
                      Administração (cortesias)
                    </Link>
                  </>
                )}
                <p className="menu__grupo">Navegação</p>
                {[...NAV_PRINCIPAL, ...NAV_MAIS]
                  .filter((item) => podeAcessar(item.to))
                  .map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      role="menuitem"
                      className={`menu__item ${NAV_PRINCIPAL.includes(item) ? "menu__item--principal" : ""}`}
                      onClick={() => setMenuAberto(false)}
                    >
                      {item.rotulo}
                    </Link>
                  ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn btn-fantasma btn-icone"
            onClick={toggleTheme}
            aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
            title={escuro ? "Tema claro" : "Tema escuro"}
          >
            {escuro ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
          </button>

          <Link
            to={ROTA_SELECIONAR_LOJA}
            className="app-navbar__loja"
            title={loja ? `Loja atual: ${loja.nomeLoja}. Clique para trocar.` : "Escolher loja"}
            data-cy="loja-ativa"
          >
            <Store size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>{loja?.nomeLoja || "Escolher loja"}</span>
          </Link>

          <span className="app-navbar__usuario" title={usuario?.email ?? undefined}>
            {usuario?.nome ?? "Minha conta"}
          </span>

          <button
            type="button"
            className="btn btn-secundario app-navbar__sair"
            onClick={sair}
            data-cy="sair"
          >
            <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
            <span className="app-navbar__sair-texto">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppNavbar;
