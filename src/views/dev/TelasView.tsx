import React, { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { estaAutenticado, obterLojaAtiva } from "@/lib/auth";
import { agendaOnlineService } from "@/services/agendaOnline";
import "./Telas.css";

/**
 * Lista de todas as telas, para conferir o app rápido na branch dev.
 * Só existe em desenvolvimento (a rota /telas redireciona para a home no build de produção).
 * Ao criar uma tela nova, inclua aqui.
 */

type Acesso = "publica" | "login" | "loja";

interface Tela {
  to: string;
  nome: string;
  acesso: Acesso;
  obs?: string;
  hash?: string;
}

interface Grupo {
  titulo: string;
  telas: Tela[];
}

const GRUPOS: Grupo[] = [
  {
    titulo: "Públicas (sem login)",
    telas: [
      { to: "/home", nome: "Home com planos", acesso: "publica" },
      { to: "/login", nome: "Entrar", acesso: "publica" },
      { to: "/register", nome: "Criar conta", acesso: "publica" },
      { to: "/recuperar-senha", nome: "Recuperar senha", acesso: "publica" },
      { to: "/termos-de-uso", nome: "Termos de uso", acesso: "publica" },
      { to: "/politicas-de-privacidade", nome: "Política de privacidade", acesso: "publica" },
      {
        to: "/confirmar/exemplo-de-link-invalido-0000000000000000",
        nome: "Confirmação do cliente (link do WhatsApp)",
        acesso: "publica",
        obs: "Com este código de exemplo aparece a tela de link inválido. O link de verdade sai do botão do WhatsApp no agendamento.",
      },
    ],
  },
  {
    titulo: "Atendimento",
    telas: [
      {
        to: "/agenda",
        nome: "Agenda",
        acesso: "loja",
        obs: "Novo agendamento, cliente na hora e fechar atendimento (comanda).",
      },
      { to: "/caixa", nome: "Caixa", acesso: "loja" },
      {
        to: "/listagem-clientes",
        nome: "Clientes",
        acesso: "loja",
        obs: "Editar e Histórico em cada linha.",
      },
      { to: "/cadastro-cliente", nome: "Novo cliente", acesso: "loja" },
      { to: "/fidelidade", nome: "Fidelidade", acesso: "loja" },
      { to: "/notificacoes", nome: "Notificações (sininho)", acesso: "loja" },
    ],
  },
  {
    titulo: "Financeiro",
    telas: [
      { to: "/painel", nome: "Painel", acesso: "loja" },
      { to: "/despesas", nome: "Despesas", acesso: "loja" },
      { to: "/recebimentos", nome: "Recebimentos (fiado)", acesso: "loja" },
      { to: "/salarios", nome: "Salários e adiantamentos", acesso: "loja" },
      { to: "/listagem-cobrancistas", nome: "Cobrancistas", acesso: "loja" },
      { to: "/cadastro-cobrancista", nome: "Novo cobrancista", acesso: "loja" },
    ],
  },
  {
    titulo: "Cadastros",
    telas: [
      { to: "/listagem-lojas", nome: "Lojas", acesso: "login" },
      { to: "/cadastro-loja", nome: "Nova loja", acesso: "login" },
      { to: "/listagem-areas-atuacao", nome: "Áreas", acesso: "loja" },
      { to: "/cadastro-area-atuacao", nome: "Nova área", acesso: "loja" },
      { to: "/listagem-funcionarios", nome: "Funcionários", acesso: "loja" },
      { to: "/cadastro-funcionario", nome: "Novo funcionário", acesso: "loja" },
      { to: "/listagem-areas-funcionario", nome: "Especialidades", acesso: "loja" },
      { to: "/cadastro-area-funcionario", nome: "Nova especialidade", acesso: "loja" },
      { to: "/listagem-servicos", nome: "Serviços", acesso: "loja" },
      { to: "/cadastro-servico", nome: "Novo serviço", acesso: "loja" },
    ],
  },
  {
    titulo: "Equipe e acesso",
    telas: [
      { to: "/listagem-equipes", nome: "Equipe", acesso: "loja" },
      { to: "/cadastro-equipe", nome: "Adicionar à equipe", acesso: "loja" },
      { to: "/cargos", nome: "Cargos e permissões", acesso: "loja" },
    ],
  },
  {
    titulo: "Loja e plano",
    telas: [
      { to: "/selecionar-loja", nome: "Escolher / trocar de loja", acesso: "login" },
      { to: "/horarios-loja", nome: "Horários de funcionamento", acesso: "loja" },
      { to: "/agendamento-online", nome: "Agendamento online (configuração)", acesso: "loja" },
      { to: "/plano", nome: "Plano e assinatura", acesso: "loja" },
    ],
  },
  {
    titulo: "Conta e ajuda",
    telas: [
      { to: "/conta", nome: "Minha conta", acesso: "login" },
      { to: "/ajuda", nome: "Ajuda e tutoriais", acesso: "login" },
      { to: "/ajuda", hash: "fidelidade", nome: "Tutorial de fidelidade", acesso: "login" },
      {
        to: "/admin",
        nome: "Administração (cortesias)",
        acesso: "login",
        obs: "Só para administradores da plataforma.",
      },
    ],
  },
];

const ROTULO: Record<Acesso, string> = {
  publica: "Pública",
  login: "Precisa de login",
  loja: "Login + loja",
};

export default function TelasView() {
  const logado = estaAutenticado();
  const loja = obterLojaAtiva();
  const [slug, setSlug] = useState<string | null>(null);

  // Página pública de agendamento: usa o endereço da loja ativa, quando houver.
  useEffect(() => {
    if (!logado || !loja) return;
    agendaOnlineService
      .ver()
      .then((c) => setSlug(c.slug))
      .catch(() => setSlug(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = GRUPOS.reduce((n, g) => n + g.telas.length, 0) + 1;

  return (
    <main className="telas">
      <header className="telas__topo">
        <p className="telas__selo">Só em desenvolvimento</p>
        <h1>Todas as telas</h1>
        <p>
          {total} telas do Agendly. Esta página não existe em produção (branch main).
          {logado
            ? loja
              ? ` Você está logado na loja ${loja.nomeLoja}.`
              : " Você está logado, mas sem loja escolhida."
            : " Você não está logado: as telas com login levam para Entrar."}
        </p>
      </header>

      {GRUPOS.map((g) => (
        <section key={g.titulo} className="telas__grupo">
          <h2>{g.titulo}</h2>
          <ul>
            {g.telas.map((t) => (
              <li key={`${t.to}#${t.hash ?? ""}`}>
                <Link to={t.to as never} hash={t.hash} className="telas__link">
                  <span className="telas__nome">{t.nome}</span>
                  <span className="telas__caminho">
                    {t.to}
                    {t.hash ? `#${t.hash}` : ""}
                  </span>
                </Link>
                <span className={`telas__acesso telas__acesso--${t.acesso}`}>
                  {ROTULO[t.acesso]}
                </span>
                {t.obs && <p className="telas__obs">{t.obs}</p>}
              </li>
            ))}
            {g.titulo.startsWith("Públicas") && (
              <li>
                {slug ? (
                  <Link
                    to={"/agendar/$slug" as never}
                    params={{ slug } as never}
                    className="telas__link"
                  >
                    <span className="telas__nome">Agendamento online do cliente</span>
                    <span className="telas__caminho">/agendar/{slug}</span>
                  </Link>
                ) : (
                  <span className="telas__nome">Agendamento online do cliente</span>
                )}
                <span className="telas__acesso telas__acesso--publica">Pública</span>
                <p className="telas__obs">
                  {slug
                    ? "Endereço da loja ativa. Só abre se o agendamento online estiver ligado."
                    : "Entre numa loja para ver o link (/agendar/<endereço-da-loja>)."}
                </p>
              </li>
            )}
          </ul>
        </section>
      ))}
    </main>
  );
}
