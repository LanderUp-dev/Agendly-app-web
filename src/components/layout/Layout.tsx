import React from "react";
import { AppPagina } from "@/components/ds/AppPagina";

/**
 * Layout legado das páginas internas. Agora delega para o AppPagina do design
 * system (Navbar única + conteúdo com largura máxima). `title` e `voltarPara`
 * ficam aceitos por compatibilidade, mas o título da página vem do PageHeader.
 */
interface LayoutProps {
  title?: string;
  voltarPara?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => <AppPagina>{children}</AppPagina>;

export default Layout;
