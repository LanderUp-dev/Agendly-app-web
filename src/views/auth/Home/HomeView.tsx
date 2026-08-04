import { useEffect, useRef, useState } from "react";
import "./HomeView.css";

/**
 * HomeView — Landing page do Agendly (convertida de HTML/CSS/JS para React + TypeScript)
 *
 * Observações:
 * - As fontes (Sora, Inter, Space Mono) e o favicon devem ser adicionados no
 *   <head> do seu documento (index.html do projeto ou via next/head), pois
 *   esse componente representa apenas o conteúdo da página:
 *
 *   <link rel="preconnect" href="https://fonts.googleapis.com">
 *   <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="">
 *   <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
 *
 * - Todo o CSS original foi mantido em HomeView.css (com pequenos ajustes de
 *   escopo: prefixo .home-view no lugar do seletor global).
 * - A lógica do script.js (scroll reveal, animação das barras do dashboard,
 *   menu mobile e acordeon do FAQ) foi portada para hooks do React.
 */

const FAQ_ITEMS = [
  {
    question: "Preciso migrar meus dados de agenda antiga?",
    answer:
      "Não. Nossa equipe te ajuda a importar clientes e horários no primeiro acesso, sem custo.",
  },
  {
    question: "O envio pelo WhatsApp é automático mesmo?",
    answer:
      "Sim. Lembretes e confirmações saem sozinhos, seguindo as regras que você configura — sem precisar abrir o WhatsApp.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer: "Sim, sem fidelidade e sem multa. Você cancela em 2 cliques direto no painel.",
  },
];

const NAV_LINKS = [
  { href: "#solucao", label: "Recursos" },
  { href: "#whatsapp", label: "WhatsApp" },
  { href: "#precos", label: "Preços" },
  { href: "#depoimentos", label: "Clientes" },
];

export default function HomeView() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dashBarsRef = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Scroll reveal (equivalente ao IntersectionObserver de .reveal / .reveal-stagger)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const els = root.querySelectorAll(".reveal, .reveal-stagger");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));

    return () => io.disconnect();
  }, []);

  // Animação das barras do dashboard ao entrar na viewport
  useEffect(() => {
    const bars = dashBarsRef.current;
    if (!bars) return;

    const barIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            bars.classList.add("in");
            barIo.unobserve(bars);
          }
        });
      },
      { threshold: 0.4 }
    );
    barIo.observe(bars);

    return () => barIo.disconnect();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="home-view" ref={rootRef}>
      <header>
        <div className="container nav">
          <a href="#" className="logo">
            <span className="logo-mark" aria-hidden="true"></span>Agendly
          </a>
          <nav className="nav-links" aria-label="Navegação principal">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <a href="../login" className="nav-login">
              Entrar
            </a>
            <a href="../register" className="btn btn-primary nav-signup">
              Criar conta grátis
            </a>
            <button
              className="menu-toggle"
              aria-label="Abrir menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <span></span>
            </button>
          </div>
        </div>
        <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`}>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} onClick={() => setMobileMenuOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="#login" onClick={() => setMobileMenuOpen(false)}>
                Entrar
              </a>
            </li>
          </ul>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow reveal">Agenda + gestão + WhatsApp em um só lugar</span>
              <h1 className="reveal">
                Chega de agenda de papel e cliente que <span className="hl">some sem avisar.</span>
              </h1>
              <p className="lead reveal">
                O Agendly organiza sua agenda, confirma presença automaticamente no WhatsApp e mostra
                o lucro real do seu salão — enquanto você cuida do que importa.
              </p>
              <div className="hero-ctas reveal">
                <a href="#cadastro" className="btn btn-primary btn-lg">
                  Testar grátis por 7 dias
                </a>
                <a href="#solucao" className="btn btn-ghost btn-lg">
                  Ver como funciona
                </a>
              </div>
              <p className="hero-note reveal">SEM CARTÃO DE CRÉDITO · CONFIGURAÇÃO EM 10 MIN</p>
              <div className="hero-proof reveal">
                <div className="avatars">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span>+0.0 salões e barbearias já usam o Agendly</span>
              </div>
            </div>

            <div className="phone-wrap reveal">
              <div className="phone">
                <div className="phone-screen">
                  <div className="wa-badge" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="#fff">
                      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 2a8 8 0 0 1 6.9 12.1l-.3.5.6 2.1-2.2-.6-.5.3A8 8 0 1 1 12 4Zm-3.1 3.9c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1s.9 2.4 1.1 2.6c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7.5-.1 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3-.1-.1-.3-.2-.5-.4-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.4-1.5-.9-.8-1.4-1.8-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.2-.6-1.6-.9-2.1-.2-.5-.4-.4-.6-.4h-.5Z" />
                    </svg>
                  </div>
                  <p className="phone-bar">AGENDLY · CONFIRMAÇÃO AUTOMÁTICA</p>
                  <div className="chat-bubble b1">
                    Oi Camila! Você tem <b>escova + hidratação</b> amanhã às 15h no Studio Bella.
                    Confirma? ✅
                  </div>
                  <div className="chat-bubble me b2">
                    Confirmado! Até amanhã 💚<span className="time">14:02</span>
                  </div>
                  <div className="chat-bubble b3">
                    Perfeito, te esperamos! Se precisar remarcar, é só responder aqui.
                    <span className="time">14:02</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEMA X SOLUÇÃO */}
        <section className="compare" id="solucao">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">O problema</span>
              <h2>Seu tempo vale mais do que responder WhatsApp o dia inteiro.</h2>
            </div>
            <div className="compare-grid reveal-stagger">
              <div className="compare-col bad">
                <h3>Sem Agendly</h3>
                <div className="compare-item">
                  <span className="ico">✕</span>Caderno de papel, agenda que ninguém encontra
                </div>
                <div className="compare-item">
                  <span className="ico">✕</span>Você responde cliente até de madrugada
                </div>
                <div className="compare-item">
                  <span className="ico">✕</span>Cliente falta e você perde o horário e o dinheiro
                </div>
                <div className="compare-item">
                  <span className="ico">✕</span>Nenhum controle real de faturamento
                </div>
              </div>
              <div className="compare-col good">
                <h3>Com Agendly</h3>
                <div className="compare-item">
                  <span className="ico">✓</span>Agenda online, sem conflito de horário
                </div>
                <div className="compare-item">
                  <span className="ico">✓</span>Confirmação e lembrete automáticos no WhatsApp
                </div>
                <div className="compare-item">
                  <span className="ico">✓</span>Redução real de faltas — e de prejuízo
                </div>
                <div className="compare-item">
                  <span className="ico">✓</span>Painel financeiro completo, sempre atualizado
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHATSAPP */}
        <section id="whatsapp">
          <div className="container wa-section">
            <div className="reveal">
              <span className="eyebrow">Diferencial nº 1</span>
              <h2>Seu salão cobrando presença sozinho — sem você mandar uma única mensagem.</h2>
              <p style={{ color: "var(--ink-70)", marginTop: 14, fontSize: 16 }}>
                Lembrete automático 24h antes, confirmação com 1 clique e reagendamento inteligente
                para quem não pode ir.
              </p>
              <div className="stat-row">
                <div className="stat">
                  <b>-60%</b>
                  <span>Faltas em salões Agendly</span>
                </div>
                <div className="stat">
                  <b>0</b>
                  <span>Mensagens manuais por dia</span>
                </div>
                <div className="stat">
                  <b>24h</b>
                  <span>Antes, lembrete automático</span>
                </div>
              </div>
            </div>
            <div className="reveal">
              <div className="ticket">
                <div className="ticket-stub">
                  <span>COMANDA Nº 0148</span>
                  <span className="stamp stamp-ok">CONFIRMADO</span>
                </div>
                <div className="ticket-tear"></div>
                <p style={{ fontWeight: 700, fontFamily: "var(--font-display)", fontSize: 17, marginBottom: 6 }}>
                  Corte + Barba
                </p>
                <p style={{ color: "var(--ink-70)", fontSize: 14, marginBottom: 14 }}>
                  Rafael M. · Amanhã, 10h30 · Barbeiro Diego
                </p>
                <div className="ticket-tear"></div>
                <div className="ticket-stub">
                  <span>ENVIADO VIA WHATSAPP</span>
                  <span className="stamp stamp-alert">LEMBRETE 24H</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DASHBOARD */}
        <section className="compare">
          <div className="container wa-section">
            <div className="reveal" style={{ order: 2 }}>
              <div className="dash-card">
                <div className="dash-topbar">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="dash-metrics">
                  <div className="metric">
                    <span>Faturamento no mês</span>
                    <b>R$ 18.240</b>
                  </div>
                  <div className="metric">
                    <span>Comissões a pagar</span>
                    <b>R$ 4.120</b>
                  </div>
                  <div className="metric">
                    <span>Taxa de comparecimento</span>
                    <b>94%</b>
                  </div>
                  <div className="metric">
                    <span>Horário de pico</span>
                    <b>Sáb, 14h</b>
                  </div>
                </div>
                <div className="bars" ref={dashBarsRef}>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
              </div>
            </div>
            <div className="reveal" style={{ order: 1 }}>
              <span className="eyebrow">Diferencial nº 2</span>
              <h2>Não é só agenda. É o raio-x financeiro do seu negócio.</h2>
              <p style={{ color: "var(--ink-70)", marginTop: 14, fontSize: 16 }}>
                Faturamento, comissão por profissional, produtos mais vendidos e horários de pico —
                tudo em um painel só, sempre atualizado.
              </p>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section>
          <div className="container">
            <div className="section-head center reveal">
              <span className="eyebrow">Como funciona</span>
              <h2>Do caos à organização em 3 passos.</h2>
            </div>
            <div className="steps reveal-stagger">
              <div className="step">
                <span className="step-num">1</span>
                <div>
                  <h3>Cadastre seu salão</h3>
                  <p>Serviços, profissionais e horários — leva menos de 10 minutos.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <div>
                  <h3>Compartilhe seu link</h3>
                  <p>Seus clientes agendam sozinhos, direto pelo celular.</p>
                </div>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <div>
                  <h3>Deixe o Agendly trabalhar</h3>
                  <p>Confirmações, lembretes e cobrança de presença, no automático.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DEPOIMENTOS */}
        <section className="compare" id="depoimentos">
          <div className="container">
            <div className="section-head reveal">
              <span className="eyebrow">Quem já usa</span>
              <h2>Donos de salão que pararam de perder dinheiro com faltas.</h2>
            </div>
            <div className="testi-track reveal">
              <div className="ticket testi">
                <p className="quote">
                  "Reduzi 40% das faltas no primeiro mês. O WhatsApp automático se pagou sozinho."
                </p>
                <div className="testi-foot">
                  <span className="av"></span>
                  <div>
                    <b>Aline Souza</b>
                    <span>Studio Hair, MG</span>
                  </div>
                </div>
              </div>
              <div className="ticket testi">
                <p className="quote">
                  "Parei de perder horário porque esquecia de confirmar cliente. Hoje é tudo
                  automático."
                </p>
                <div className="testi-foot">
                  <span className="av"></span>
                  <div>
                    <b>Diego Barbeiro</b>
                    <span>Barbearia Nagô, MG</span>
                  </div>
                </div>
              </div>
              <div className="ticket testi">
                <p className="quote">
                  "Finalmente sei quanto lucro de verdade. Antes era só chute no fim do mês."
                </p>
                <div className="testi-foot">
                  <span className="av"></span>
                  <div>
                    <b>Renata Lima</b>
                    <span>Espaço Renove Estética, RJ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PREÇOS */}
        <section className="pricing" id="precos">
          <div className="container">
            <div className="section-head center reveal">
              <span className="eyebrow">Preços</span>
              <h2>Um cliente a mais que não falta já paga o Agendly do mês.</h2>
            </div>
            <div className="price-grid reveal-stagger">
              <div className="ticket plan">
                <h3>Solo</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-50)" }}>Para profissionais autônomos</p>
                <p className="price">
                  R$ 59<span>/mês</span>
                </p>
                <ul>
                  <li>1 profissional</li>
                  <li>Agenda online ilimitada</li>
                  <li>Lembretes por WhatsApp</li>
                </ul>
                <a href="#cadastro" className="btn btn-ghost btn-block">
                  Começar agora
                </a>
              </div>
              <div className="ticket plan featured">
                <span className="plan-badge">Mais escolhido</span>
                <h3>Equipe</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-50)" }}>Para salões e barbearias</p>
                <p className="price">
                  R$ 149<span>/mês</span>
                </p>
                <ul>
                  <li>Até 6 profissionais</li>
                  <li>Confirmação automática no WhatsApp</li>
                  <li>Painel financeiro completo</li>
                  <li>Comissão por profissional</li>
                </ul>
                <a href="#cadastro" className="btn btn-primary btn-block">
                  Começar agora
                </a>
              </div>
            {/*  <div className="ticket plan">
                <h3>Rede</h3>
                <p style={{ fontSize: 13.5, color: "var(--ink-50)" }}>Para múltiplas unidades</p>
                <p className="price">
                  R$ 249<span>/mês</span>
                </p>
                <ul>
                  <li>Profissionais ilimitados</li>
                  <li>Multi-unidades</li>
                  <li>Relatórios avançados</li>
                </ul>
                <a href="#cadastro" className="btn btn-ghost btn-block">
                  Começar agora
                </a>
              </div>
              */}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="container" style={{ maxWidth: 760 }}>
            <div className="section-head reveal">
              <span className="eyebrow">Dúvidas</span>
              <h2>Perguntas frequentes</h2>
            </div>
            <div className="reveal">
              {FAQ_ITEMS.map((item, index) => (
                <div
                  key={item.question}
                  className={`faq-item${openFaqIndex === index ? " open" : ""}`}
                >
                  <button className="faq-q" onClick={() => toggleFaq(index)}>
                    {item.question} <span className="plus"></span>
                  </button>
                  <div className="faq-a">
                    <p>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section>
          <div className="container">
            <div className="final-cta reveal">
              <h2>Seu salão pode rodar sozinho a partir de hoje.</h2>
              <p>Teste grátis, sem cartão de crédito. Configuração em menos de 10 minutos.</p>
              <a href="#cadastro" className="btn btn-primary btn-lg">
                Criar conta grátis
              </a>
              <p className="final-cta-note">
                Já tem conta?{" "}
                <a href="../login" style={{ color: "#fff", textDecoration: "underline" }}>
                  Entrar
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container foot-grid">
          <span>© 2026 Agendly. Todos os direitos reservados.</span>
          <div className="foot-links">
          <a href="../login">Entrar</a>
            <a href="../register">Criar conta</a>
            <a href="#">Privacidade</a>
            <a href="#">Termos de uso</a>
          </div>
        </div>
      </footer>
    </div>
  );
}