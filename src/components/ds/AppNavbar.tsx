import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Moon, Store, Sun, X } from "lucide-react";
import { Logo } from "./Logo";
import { SinoNotificacoes } from "./SinoNotificacoes";
import { GRUPOS_MENU, NAV_PRINCIPAL } from "./navegacao";
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
              <div id="menu-navegacao" className="menu__painel menu__painel--grupos" role="menu">
                {GRUPOS_MENU.map((grupo) => {
                  const itens = grupo.itens.filter((item) => podeAcessar(item.to));
                  if (itens.length === 0) return null;
                  return (
                    <div
                      key={grupo.titulo}
                      className="menu__secao"
                      role="group"
                      aria-label={grupo.titulo}
                    >
                      <p className="menu__grupo" aria-hidden="true">
                        {grupo.titulo}
                      </p>
                      {itens.map((item) => (
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
                  );
                })}

                <div
                  className="menu__secao menu__secao--config"
                  role="group"
                  aria-label="Configurações da loja"
                >
                  <p className="menu__grupo" aria-hidden="true">
                    Configurações da loja
                  </p>
                  <Link
                    to={ROTA_SELECIONAR_LOJA}
                    role="menuitem"
                    className="menu__item"
                    onClick={() => setMenuAberto(false)}
                    data-cy="menu-trocar-loja"
                  >
                    {loja ? "Trocar de loja" : "Escolher loja"}
                    {loja && <span className="menu__item-detalhe">{loja.nomeLoja}</span>}
                  </Link>
                  {loja && (
                    <Link
                      to="/horarios-loja"
                      role="menuitem"
                      className="menu__item"
                      onClick={() => setMenuAberto(false)}
                      data-cy="menu-horarios"
                    >
                      Horários de funcionamento
                    </Link>
                  )}
                  {loja && (
                    <Link
                      to="/plano"
                      role="menuitem"
                      className="menu__item"
                      onClick={() => setMenuAberto(false)}
                      data-cy="menu-plano"
                    >
                      Plano e assinatura
                    </Link>
                  )}
                </div>

                {ehAdmin && (
                  <div
                    className="menu__secao menu__secao--config"
                    role="group"
                    aria-label="Plataforma Agendly"
                  >
                    <p className="menu__grupo" aria-hidden="true">
                      Plataforma Agendly
                    </p>
                    <Link
                      to="/admin"
                      role="menuitem"
                      className="menu__item"
                      onClick={() => setMenuAberto(false)}
                      data-cy="menu-admin"
                    >
                      Administração (cortesias)
                      <span className="menu__item-detalhe">todas as lojas</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {loja && <SinoNotificacoes />}

          <button
            type="button"
            className="btn btn-fantasma btn-icone"
            onClick={toggleTheme}
            aria-label={escuro ? "Usar tema claro" : "Usar tema escuro"}
            title={escuro ? "Tema claro" : "Tema escuro"}
          >
            {escuro ? <Sun size={20} strokeWidth={1.75} /> : <Moon size={20} strokeWidth={1.75} />}
          </button>

          {/* Loja e usuário empilhados num bloco só: cada um com reticências próprias,
              sem disputar espaço com o botão Sair. */}
          <Link
            to={ROTA_SELECIONAR_LOJA}
            className="app-navbar__conta"
            title={
              loja
                ? `Loja atual: ${loja.nomeLoja}. Clique para trocar.${usuario?.email ? ` Conta: ${usuario.email}` : ""}`
                : "Escolher loja"
            }
            data-cy="loja-ativa"
          >
            <Store
              size={18}
              strokeWidth={1.75}
              aria-hidden="true"
              className="app-navbar__conta-icone"
            />
            <span className="app-navbar__conta-textos">
              <span className="app-navbar__conta-loja">{loja?.nomeLoja || "Escolher loja"}</span>
              <span className="app-navbar__conta-usuario" data-cy="usuario-nome">
                {usuario?.nome ?? "Minha conta"}
                {ehAdmin && (
                  <span className="app-navbar__admin" data-cy="selo-admin">
                    {" "}
                    · admin
                  </span>
                )}
              </span>
            </span>
          </Link>

          <button
            type="button"
            className="btn btn-secundario app-navbar__sair"
            onClick={sair}
            aria-label="Sair da conta"
            title="Sair"
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
