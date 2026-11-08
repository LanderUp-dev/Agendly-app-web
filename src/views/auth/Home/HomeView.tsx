// @requisito RE-14
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  Menu,
  MessageCircle,
  Store,
  Users,
  X,
} from "lucide-react";
import { Logo } from "@/components/ds";
import "./HomeView.css";

/**
 * Home (landing page) do Agendly.
 *
 * Regras desta página (ver docs/design-system.md):
 * - Só promete o que o sistema faz hoje. O que ainda não existe aparece como "Em breve".
 * - Sem números, depoimentos ou contadores sem fonte.
 * - Tokens e componentes do design system (Logo, .btn, cores, raio, foco).
 * - Conteúdo visível sem animação: o movimento é só um enfeite (prefers-reduced-motion).
 */

const FAQ_ITEMS = [
  {
    pergunta: "Preciso instalar alguma coisa?",
    resposta: "Não. O Agendly funciona no navegador, no computador ou no celular.",
  },
  {
    pergunta: "O envio de lembretes pelo WhatsApp já funciona?",
    resposta:
      "Ainda não. A confirmação e os lembretes automáticos pelo WhatsApp estão em desenvolvimento. Hoje o Agendly organiza a agenda, os clientes, os serviços e a equipe.",
  },
  {
    pergunta: "Posso cancelar quando quiser?",
    resposta: "Sim, sem fidelidade e sem multa.",
  },
];

const NAV_LINKS = [
  { href: "#recursos", rotulo: "Recursos" },
  { href: "#em-breve", rotulo: "Em breve" },
  { href: "#precos", rotulo: "Preços" },
  { href: "#duvidas", rotulo: "Dúvidas" },
];

function EmBreve() {
  return <span className="hv-selo hv-selo--breve">Em breve</span>;
}

export default function HomeView() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [menuAberto, setMenuAberto] = useState(false);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  // Revelar ao rolar: só um enfeite. O conteúdo já é visível sem JS e com
  // movimento reduzido (a classe .hv-anima só entra quando é seguro animar).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzir || !("IntersectionObserver" in window)) return;

    root.classList.add("hv-anima");
    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("hv-visivel");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll(".hv-revela").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Esc fecha o menu mobile
  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuAberto]);

  return (
    <div className="home-view" ref={rootRef}>
      <a href="#conteudo-home" className="pular-para-conteudo">
        Pular para o conteúdo
      </a>

      <header className="hv-cabecalho">
        <div className="hv-container hv-nav">
          <Link to="/home" aria-label="Agendly — início" className="hv-logo">
            <Logo variante="auto" titulo="" />
          </Link>

          <nav className="hv-nav-links" aria-label="Seções da página">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.rotulo}
              </a>
            ))}
          </nav>

          <div className="hv-nav-acoes">
            <Link to="/login" className="btn btn-fantasma hv-entrar">
              Entrar
            </Link>
            <Link to="/register" className="btn btn-primario" data-cy="home-criar-conta">
              Criar conta
            </Link>
            <button
              type="button"
              className="btn btn-fantasma btn-icone hv-menu-botao"
              aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menuAberto}
              aria-controls="hv-menu-mobile"
              onClick={() => setMenuAberto((v) => !v)}
            >
              {menuAberto ? (
                <X size={20} strokeWidth={1.75} />
              ) : (
                <Menu size={20} strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        {menuAberto && (
          <nav id="hv-menu-mobile" className="hv-menu-mobile" aria-label="Menu">
            <ul className="hv-container">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setMenuAberto(false)}>
                    {l.rotulo}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/login" onClick={() => setMenuAberto(false)}>
                  Entrar
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main id="conteudo-home" tabIndex={-1}>
        {/* HERO */}
        <section className="hv-hero">
          <div className="hv-container hv-hero-grade">
            <div className="hv-revela">
              <h1 className="hv-titulo">Chega de agenda de papel e de horário perdido.</h1>
              <p className="hv-lead">
                O Agendly organiza a agenda do dia por profissional em salões, barbearias e
                estúdios, e reúne clientes, serviços e equipe em um só lugar, no computador ou no
                celular.
              </p>
              <div className="hv-ctas">
                <Link
                  to="/register"
                  className="btn btn-primario hv-btn-grande"
                  data-cy="home-cta-principal"
                >
                  Criar conta grátis
                </Link>
                <a href="#como-funciona" className="btn btn-secundario hv-btn-grande">
                  Ver como funciona
                </a>
              </div>
              <p className="hv-nota">Criar a conta não pede cartão de crédito.</p>
            </div>

            {/* Exemplo visual da agenda (decorativo, com descrição para leitor de tela) */}
            <div
              className="hv-revela hv-mock-agenda"
              role="img"
              aria-label="Exemplo da agenda do dia: colunas por profissional com os agendamentos de cada um"
            >
              <div className="hv-mock-topo" aria-hidden="true">
                <span className="hv-mock-data">Sábado, 7 de novembro</span>
                <span className="hv-mock-seg">1 h</span>
              </div>
              <div className="hv-mock-grade" aria-hidden="true">
                <span className="hv-mock-prof" style={{ gridColumn: 2, gridRow: 1 }}>
                  Ana
                </span>
                <span className="hv-mock-prof" style={{ gridColumn: 3, gridRow: 1 }}>
                  Bruno
                </span>
                {["09:00", "10:00", "11:00", "12:00"].map((h, i) => (
                  <MockLinha key={h} hora={h} linha={i + 2} />
                ))}
                <span
                  className="hv-mock-ev hv-tom-verde"
                  style={{ gridColumn: 2, gridRow: "2 / span 2" }}
                >
                  <b>Mariana Souza</b>
                  <span>Corte, 9h às 10h30</span>
                </span>
                <span className="hv-mock-ev hv-tom-azul" style={{ gridColumn: 3, gridRow: 3 }}>
                  <b>Diego Alves</b>
                  <span>Barba, 10h às 11h</span>
                </span>
                <span className="hv-mock-ev hv-tom-ambar" style={{ gridColumn: 2, gridRow: 5 }}>
                  <b>Lia Prado</b>
                  <span>Escova, 12h às 13h</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEMA X SOLUÇÃO */}
        <section className="hv-secao hv-secao--alt" id="recursos">
          <div className="hv-container">
            <div className="hv-cabeca hv-revela">
              <h2>Sua agenda organizada, sem caderno e sem planilha.</h2>
            </div>
            <div className="hv-comparar hv-revela">
              <div className="hv-coluna">
                <h3>Sem o Agendly</h3>
                <ul>
                  {[
                    "Caderno de papel que só uma pessoa entende",
                    "Horário marcado em dobro para o mesmo profissional",
                    "Dados de clientes espalhados em conversas",
                    "Cada unidade com o seu controle",
                  ].map((t) => (
                    <li key={t}>
                      <span className="hv-ico hv-ico--nao" aria-hidden="true">
                        <X size={14} strokeWidth={2.25} />
                      </span>
                      <span className="sr-only">Problema: </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hv-coluna hv-coluna--sim">
                <h3>Com o Agendly</h3>
                <ul>
                  {[
                    "Agenda do dia por profissional, em 15, 30 ou 60 minutos",
                    "Cadastro de clientes, serviços e preços",
                    "Equipe e funcionários vinculados a cada loja",
                    "Mais de uma loja na mesma conta",
                  ].map((t) => (
                    <li key={t}>
                      <span className="hv-ico hv-ico--sim" aria-hidden="true">
                        <Check size={14} strokeWidth={2.25} />
                      </span>
                      <span className="sr-only">Com o Agendly: </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="hv-secao" id="como-funciona">
          <div className="hv-container">
            <div className="hv-cabeca hv-revela">
              <h2>Do cadastro à agenda em 3 passos.</h2>
            </div>
            <ol className="hv-passos hv-revela">
              <li>
                <span className="hv-passo-icone" aria-hidden="true">
                  <Store size={20} strokeWidth={1.75} />
                </span>
                <h3>Crie a conta e a loja</h3>
                <p>Cadastre sua unidade com endereço e contato.</p>
              </li>
              <li>
                <span className="hv-passo-icone" aria-hidden="true">
                  <Users size={20} strokeWidth={1.75} />
                </span>
                <h3>Cadastre serviços e equipe</h3>
                <p>Serviços com preço e comissão, profissionais e áreas de atuação.</p>
              </li>
              <li>
                <span className="hv-passo-icone" aria-hidden="true">
                  <CalendarDays size={20} strokeWidth={1.75} />
                </span>
                <h3>Organize o dia</h3>
                <p>Veja a agenda por profissional e encontre horários livres com um clique.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* EM BREVE */}
        <section className="hv-secao hv-secao--alt" id="em-breve">
          <div className="hv-container">
            <div className="hv-cabeca hv-revela">
              <h2>O que estamos construindo.</h2>
              <p className="hv-cabeca-texto">
                Estes recursos ainda não estão disponíveis. Mostramos aqui para você saber o que vem
                por aí.
              </p>
            </div>
            <div className="hv-breve-grade hv-revela">
              <article className="hv-breve-card">
                <div className="hv-breve-topo">
                  <span className="hv-passo-icone" aria-hidden="true">
                    <MessageCircle size={20} strokeWidth={1.75} />
                  </span>
                  <EmBreve />
                </div>
                <h3>Lembretes e confirmação pelo WhatsApp</h3>
                <p>Lembrete antes do horário e confirmação de presença pelo próprio cliente.</p>
                <div className="hv-comanda" aria-label="Exemplo de mensagem de confirmação">
                  <p className="hv-comanda-msg">
                    Oi, Camila! Você tem <b>escova</b> amanhã às 15h no Studio Bella. Confirma?
                  </p>
                  <p className="hv-comanda-meta">
                    <Clock size={14} strokeWidth={1.75} aria-hidden="true" /> Exemplo ilustrativo
                  </p>
                </div>
              </article>
              <article className="hv-breve-card">
                <div className="hv-breve-topo">
                  <span className="hv-passo-icone" aria-hidden="true">
                    <BarChart3 size={20} strokeWidth={1.75} />
                  </span>
                  <EmBreve />
                </div>
                <h3>Painel financeiro</h3>
                <p>Faturamento do mês, comissão por profissional e horários de maior movimento.</p>
                <div
                  className="hv-barras"
                  role="img"
                  aria-label="Exemplo ilustrativo de gráfico de faturamento"
                >
                  {[40, 62, 48, 80, 70, 95].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* PREÇOS */}
        <section className="hv-secao" id="precos">
          <div className="hv-container">
            <div className="hv-cabeca hv-cabeca--centro hv-revela">
              <h2>Planos simples, sem fidelidade.</h2>
            </div>
            <div className="hv-planos hv-revela">
              <article className="hv-plano">
                <h3>Solo</h3>
                <p className="hv-plano-desc">Para profissionais autônomos</p>
                <p className="hv-preco">
                  R$ 59<span>/mês</span>
                </p>
                <ul>
                  <li>
                    <Check size={16} strokeWidth={2} aria-hidden="true" />1 profissional
                  </li>
                  <li>
                    <Check size={16} strokeWidth={2} aria-hidden="true" />
                    Agenda online
                  </li>
                  <li className="hv-plano-breve">
                    <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
                    Lembretes por WhatsApp <EmBreve />
                  </li>
                </ul>
                <Link to="/register" className="btn btn-secundario btn-bloco">
                  Começar agora
                </Link>
              </article>
              <article className="hv-plano hv-plano--destaque">
                <span className="hv-selo hv-selo--marca">Mais escolhido</span>
                <h3>Equipe</h3>
                <p className="hv-plano-desc">Para salões e barbearias</p>
                <p className="hv-preco">
                  R$ 149<span>/mês</span>
                </p>
                <ul>
                  <li>
                    <Check size={16} strokeWidth={2} aria-hidden="true" />
                    Até 6 profissionais
                  </li>
                  <li>
                    <Check size={16} strokeWidth={2} aria-hidden="true" />
                    Agenda por profissional
                  </li>
                  <li>
                    <Check size={16} strokeWidth={2} aria-hidden="true" />
                    Comissão por serviço
                  </li>
                  <li className="hv-plano-breve">
                    <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
                    Confirmação no WhatsApp <EmBreve />
                  </li>
                  <li className="hv-plano-breve">
                    <Clock size={16} strokeWidth={1.75} aria-hidden="true" />
                    Painel financeiro <EmBreve />
                  </li>
                </ul>
                <Link to="/register" className="btn btn-primario btn-bloco">
                  Começar agora
                </Link>
              </article>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="hv-secao hv-secao--alt" id="duvidas">
          <div className="hv-container hv-container--estreito">
            <div className="hv-cabeca hv-revela">
              <h2>Perguntas frequentes</h2>
            </div>
            <div className="hv-faq hv-revela">
              {FAQ_ITEMS.map((item, i) => {
                const aberto = faqAberto === i;
                return (
                  <div key={item.pergunta} className={`hv-faq-item${aberto ? " aberto" : ""}`}>
                    <h3>
                      <button
                        type="button"
                        className="hv-faq-pergunta"
                        aria-expanded={aberto}
                        aria-controls={`hv-faq-${i}`}
                        id={`hv-faq-btn-${i}`}
                        onClick={() => setFaqAberto(aberto ? null : i)}
                      >
                        {item.pergunta}
                        <ChevronDown size={20} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    </h3>
                    <div
                      id={`hv-faq-${i}`}
                      role="region"
                      aria-labelledby={`hv-faq-btn-${i}`}
                      className="hv-faq-resposta"
                      hidden={!aberto}
                    >
                      <p>{item.resposta}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="hv-secao">
          <div className="hv-container">
            <div className="hv-cta-final hv-revela">
              <h2>Comece a organizar sua agenda hoje.</h2>
              <p>Criar a conta é grátis e não pede cartão de crédito.</p>
              <Link to="/register" className="btn btn-primario hv-btn-grande">
                Criar conta grátis
              </Link>
              <p className="hv-cta-final-nota">
                Já tem conta?{" "}
                <Link to="/login" className="link">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="hv-rodape">
        <div className="hv-container hv-rodape-grade">
          <span>© 2026 Agendly</span>
          <nav className="hv-rodape-links" aria-label="Rodapé">
            <Link to="/login">Entrar</Link>
            <Link to="/register">Criar conta</Link>
            <Link to="/politicas-de-privacidade">Privacidade</Link>
            <Link to="/termos-de-uso">Termos de uso</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function MockLinha({ hora, linha }: { hora: string; linha: number }) {
  return (
    <>
      <span className="hv-mock-hora" style={{ gridColumn: 1, gridRow: linha }}>
        {hora}
      </span>
      <span className="hv-mock-celula" style={{ gridColumn: 2, gridRow: linha }} />
      <span className="hv-mock-celula" style={{ gridColumn: 3, gridRow: linha }} />
    </>
  );
}
