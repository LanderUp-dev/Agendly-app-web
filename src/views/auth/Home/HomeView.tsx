// @requisito RE-14
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/ds";
import "./HomeView.css";

/**
 * Home (landing page) do Agendly. Direção "Navalha" (Hallmark, redesign full).
 *
 * Regras desta página (ver docs/design-system.md):
 * - Só promete o que o sistema faz hoje. O que ainda não existe aparece como "Em breve".
 * - Sem números, depoimentos ou contadores sem fonte. Nomes e valores dos exemplos são
 *   ilustrativos e estão marcados como exemplo.
 * - Conteúdo visível sem JavaScript e sem animação.
 */

const FAQ_ITEMS = [
  {
    pergunta: "Preciso instalar alguma coisa?",
    resposta: "Não. O Agendly funciona no navegador, no computador ou no celular.",
  },
  {
    pergunta: "Tem teste grátis?",
    resposta:
      "Sim. Toda loja nova tem 14 dias para testar tudo, e criar a conta não pede cartão de crédito.",
  },
  {
    pergunta: "Como funciona a confirmação pelo WhatsApp?",
    resposta:
      "No agendamento, um clique abre o WhatsApp da sua loja com a mensagem de confirmação pronta. Você envia do seu próprio número e marca o horário como confirmado ou cancelado. Os lembretes automáticos, sem você precisar enviar, estão em desenvolvimento.",
  },
  {
    pergunta: "O Agendly controla o caixa e as comissões?",
    resposta:
      "Sim. Você abre e fecha o caixa, recebe cada atendimento em Pix, dinheiro, débito ou crédito, e o Agendly calcula o troco, o faturamento e quanto cada profissional tem a receber.",
  },
  {
    pergunta: "Posso cancelar quando quiser?",
    resposta: "Sim, sem fidelidade e sem multa.",
  },
];

const NAV_LINKS = [
  { href: "#como-funciona", rotulo: "Como funciona" },
  { href: "#recursos", rotulo: "Recursos" },
  { href: "#precos", rotulo: "Preços" },
  { href: "#duvidas", rotulo: "Dúvidas" },
];

const RECURSOS_PLANO = [
  "Agenda online e horários livres",
  "Caixa e comanda com Pix, dinheiro e cartão",
  "Painel financeiro",
  "Confirmação pelo WhatsApp da loja",
  "Clientes, histórico e fidelidade",
];

const CADERNO_X_AGENDLY = [
  [
    "Horário marcado em dobro para o mesmo profissional",
    "Agenda do dia por profissional, sem horário marcado em dobro",
  ],
  [
    "Cliente que esquece o horário e não avisa",
    "Confirmação do horário pelo WhatsApp da loja em um clique",
  ],
  ["Caixa que não fecha no fim do dia", "Caixa com abertura, sangria e fechamento conferido"],
  [
    "Comissão calculada na mão, no fim do mês",
    "Comissão e salário de cada profissional calculados",
  ],
  ["Dados de clientes espalhados em conversas", "Clientes com histórico e contagem de visitas"],
];

type Evento = {
  col: number;
  ini: number;
  fim: number;
  cliente: string;
  servico: string;
  status?: string;
  tom: "pago" | "ok" | "espera" | "neutro";
};

const PROFISSIONAIS = ["Rafa", "Bruno", "Léo"];
const HORAS = ["09:00", "10:00", "11:00", "12:00"];
// ini/fim em meias horas a partir das 9h (0 = 9h00, 2 = 10h00…)
const EVENTOS: Evento[] = [
  {
    col: 0,
    ini: 0,
    fim: 3,
    cliente: "Diego Alves",
    servico: "Corte e barba",
    status: "Pago no Pix",
    tom: "pago",
  },
  { col: 0, ini: 5, fim: 7, cliente: "Paulo Reis", servico: "Pigmentação", tom: "neutro" },
  {
    col: 1,
    ini: 2,
    fim: 4,
    cliente: "Marcos Lima",
    servico: "Barba",
    status: "Confirmado",
    tom: "ok",
  },
  {
    col: 2,
    ini: 0,
    fim: 2,
    cliente: "Caio Nunes",
    servico: "Corte",
    status: "Sem resposta",
    tom: "espera",
  },
  {
    col: 2,
    ini: 4,
    fim: 6,
    cliente: "Tiago Rocha",
    servico: "Corte",
    status: "Confirmado",
    tom: "ok",
  },
];

function EmBreve() {
  return <span className="hv-selo-breve">Em breve</span>;
}

export default function HomeView() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [faqAberto, setFaqAberto] = useState<number | null>(null);

  // Esc fecha o menu mobile
  useEffect(() => {
    if (!menuAberto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuAberto(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuAberto]);

  return (
    <div className="home-view">
      <a href="#conteudo-home" className="pular-para-conteudo">
        Pular para o conteúdo
      </a>

      <header className="hv-cabecalho hv-floresta">
        <div className="hv-container hv-nav">
          <Link to="/home" aria-label="Agendly — início" className="hv-logo">
            <Logo variante="auto" claro titulo="" />
          </Link>

          <nav className="hv-nav-links" aria-label="Seções da página">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href}>
                {l.rotulo}
              </a>
            ))}
          </nav>

          <div className="hv-nav-acoes">
            <Link to="/login" className="hv-btn hv-btn--fantasma hv-entrar">
              Entrar
            </Link>
            <Link to="/register" className="hv-btn hv-btn--primario" data-cy="home-criar-conta">
              Criar conta
            </Link>
            <button
              type="button"
              className="hv-btn hv-btn--fantasma hv-btn--icone hv-menu-botao"
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
        {/* HERO: a agenda de um sábado é a assinatura da página */}
        <section className="hv-hero hv-floresta">
          <div className="hv-container hv-hero-grade">
            <div className="hv-hero-texto">
              <h1>A agenda e o caixa da barbearia.</h1>
              <p className="hv-lead">
                Agenda por profissional, confirmação no WhatsApp e comissão calculada no fechamento.
              </p>
              <div className="hv-ctas">
                <Link
                  to="/register"
                  className="hv-btn hv-btn--primario hv-btn--grande"
                  data-cy="home-cta-principal"
                >
                  Criar conta grátis
                </Link>
                <a href="#como-funciona" className="hv-btn hv-btn--secundario hv-btn--grande">
                  Ver como funciona
                </a>
              </div>
              <p className="hv-nota">
                14 dias grátis. Criar a conta não pede cartão de crédito. Para barbearias, salões e
                estúdios.
              </p>
            </div>

            <figure className="hv-quadro">
              <div className="hv-quadro-topo">
                <span>Sábado, 14 de novembro</span>
                <span className="hv-quadro-exemplo">Exemplo</span>
              </div>
              <div
                className="hv-quadro-grade"
                role="img"
                aria-label="Exemplo da agenda do dia: uma coluna por profissional com os horários de cada um, alguns confirmados pelo WhatsApp e um já pago no Pix"
              >
                {PROFISSIONAIS.map((p, i) => (
                  <span
                    key={p}
                    className="hv-quadro-prof"
                    style={{ gridColumn: i + 2, gridRow: 1 }}
                    aria-hidden="true"
                  >
                    {p}
                  </span>
                ))}
                {HORAS.map((h, i) => (
                  <span
                    key={h}
                    className="hv-quadro-hora"
                    style={{ gridColumn: 1, gridRow: `${i * 2 + 2} / span 2` }}
                    aria-hidden="true"
                  >
                    {h}
                  </span>
                ))}
                {EVENTOS.map((e) => (
                  <span
                    key={`${e.col}-${e.ini}`}
                    className={`hv-evento hv-evento--${e.tom}`}
                    style={{ gridColumn: e.col + 2, gridRow: `${e.ini + 2} / ${e.fim + 2}` }}
                    aria-hidden="true"
                  >
                    <b>{e.cliente}</b>
                    <span>{e.servico}</span>
                    {e.status && <em>{e.status}</em>}
                  </span>
                ))}
              </div>
            </figure>
          </div>
        </section>

        {/* CADERNO X AGENDLY */}
        <section className="hv-secao hv-papel" id="sem-e-com">
          <div className="hv-container hv-livro">
            <h2>Do caderno para a tela.</h2>
            <table className="hv-livro-tabela">
              <caption className="sr-only">
                Problemas do caderno de papel e como o Agendly resolve cada um
              </caption>
              <thead>
                <tr>
                  <th scope="col">Sem o Agendly</th>
                  <th scope="col">Com o Agendly</th>
                </tr>
              </thead>
              <tbody>
                {CADERNO_X_AGENDLY.map(([sem, com]) => (
                  <tr key={sem}>
                    <td className="hv-livro-sem">{sem}</td>
                    <td>{com}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="hv-secao hv-papel hv-secao--colada" id="como-funciona">
          <div className="hv-container hv-passos-grade">
            <h2>Do cadastro à agenda em 3 passos.</h2>
            <ol className="hv-passos">
              <li>
                <span className="hv-passo-num" aria-hidden="true">
                  1
                </span>
                <h3>Crie a conta e a loja</h3>
                <p>Cadastre sua unidade com endereço e contato.</p>
              </li>
              <li>
                <span className="hv-passo-num" aria-hidden="true">
                  2
                </span>
                <h3>Cadastre serviços e equipe</h3>
                <p>Serviços com preço e comissão, profissionais e áreas de atuação.</p>
              </li>
              <li>
                <span className="hv-passo-num" aria-hidden="true">
                  3
                </span>
                <h3>Organize o dia</h3>
                <p>Veja a agenda por profissional e encontre horários livres com um clique.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* RECURSOS: a comanda, a mensagem e o painel mostrados, não descritos */}
        <section className="hv-secao hv-floresta" id="recursos">
          <div className="hv-container">
            <div className="hv-recursos-cabeca">
              <h2>Da agenda ao caixa, tudo no mesmo lugar.</h2>
              <p>Todos os recursos abaixo já estão disponíveis nos dois planos.</p>
            </div>

            <div className="hv-recursos-palco">
              <article className="hv-recurso hv-recurso--comanda">
                <div className="hv-comanda" role="group" aria-label="Exemplo de comanda fechada">
                  <p className="hv-comanda-titulo">Comanda de Diego Alves</p>
                  <table className="hv-comanda-itens">
                    <tbody>
                      <tr>
                        <th scope="row">Corte, com Rafa</th>
                        <td>R$ 45,00</td>
                      </tr>
                      <tr>
                        <th scope="row">Barba, com Rafa</th>
                        <td>R$ 30,00</td>
                      </tr>
                      <tr className="hv-comanda-total">
                        <th scope="row">Total</th>
                        <td>R$ 75,00</td>
                      </tr>
                      <tr>
                        <th scope="row">Pix</th>
                        <td>R$ 50,00</td>
                      </tr>
                      <tr>
                        <th scope="row">Dinheiro</th>
                        <td>R$ 30,00</td>
                      </tr>
                      <tr className="hv-comanda-troco">
                        <th scope="row">Troco</th>
                        <td>R$ 5,00</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="hv-comanda-nota">Exemplo ilustrativo</p>
                </div>
                <div className="hv-recurso-texto">
                  <h3>Caixa e comanda</h3>
                  <p>
                    Receba em Pix, dinheiro, débito ou crédito, até dividido. O troco é calculado, e
                    o caixa tem abertura, sangria e fechamento conferido.
                  </p>
                </div>
              </article>

              <article className="hv-recurso">
                <div className="hv-whats" aria-label="Exemplo de mensagem de confirmação">
                  <p>
                    Oi, Marcos! Você tem <b>barba</b> amanhã às 10h na Barbearia do Rafa. Confirma?
                  </p>
                  <span>Exemplo ilustrativo</span>
                </div>
                <h3>Confirmação pelo WhatsApp da loja</h3>
                <p>
                  Um clique abre o WhatsApp da loja com a mensagem pronta. Você marca o horário como
                  confirmado ou cancelado.
                </p>
              </article>

              <article className="hv-recurso">
                <div
                  className="hv-barras"
                  role="img"
                  aria-label="Exemplo ilustrativo de gráfico de faturamento"
                >
                  {[40, 62, 48, 80, 70, 95].map((h, i) => (
                    <i key={i} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <h3>Painel financeiro</h3>
                <p>
                  Faturamento, ticket médio e taxa de faltas, por profissional, serviço e forma de
                  pagamento.
                </p>
              </article>
            </div>

            <ul className="hv-recursos-lista">
              <li>
                <h3>Agenda por profissional</h3>
                <p>Em 15, 30 ou 60 minutos, respeitando o funcionamento da loja.</p>
              </li>
              <li>
                <h3>Comissões, salários e contas</h3>
                <p>
                  Quanto cada profissional tem a receber, com adiantamento, despesas e recebimentos.
                </p>
              </li>
              <li>
                <h3>Clientes e fidelidade</h3>
                <p>Histórico, contagem de visitas e mais de uma loja na mesma conta.</p>
              </li>
            </ul>

            <p className="hv-recursos-breve">
              <EmBreve /> Lembretes automáticos pelo WhatsApp: o cliente recebe o lembrete e
              confirma sozinho.
            </p>
          </div>
        </section>

        {/* PREÇOS */}
        <section className="hv-secao hv-papel" id="precos">
          <div className="hv-container">
            <h2>Planos simples, sem fidelidade.</h2>
            <div className="hv-planos">
              <article className="hv-plano">
                <h3>Solo</h3>
                <p className="hv-plano-desc">Para profissionais autônomos</p>
                <p className="hv-preco">
                  R$ 59<span>/mês</span>
                </p>
                <p className="hv-plano-limite">1 profissional</p>
                <Link to="/register" className="hv-btn hv-btn--secundario">
                  Começar agora
                </Link>
              </article>
              <article className="hv-plano">
                <h3>Equipe</h3>
                <p className="hv-plano-desc">Para salões e barbearias</p>
                <p className="hv-preco">
                  R$ 149<span>/mês</span>
                </p>
                <p className="hv-plano-limite">
                  Até 6 profissionais, com comissão e salário por profissional
                </p>
                <Link to="/register" className="hv-btn hv-btn--primario">
                  Começar agora
                </Link>
              </article>
              <div className="hv-planos-inclui">
                <h3>Nos dois planos</h3>
                <ul>
                  {RECURSOS_PLANO.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                  <li className="hv-plano-breve">
                    Lembretes automáticos <EmBreve />
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="hv-secao hv-papel hv-secao--colada" id="duvidas">
          <div className="hv-container hv-faq-grade">
            <h2>Perguntas frequentes</h2>
            <div className="hv-faq">
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
        <section className="hv-secao hv-floresta hv-final">
          <div className="hv-container hv-final-grade">
            <h2>Comece a organizar sua loja hoje.</h2>
            <div>
              <p>14 dias grátis para testar tudo. Criar a conta não pede cartão de crédito.</p>
              <Link to="/register" className="hv-btn hv-btn--primario hv-btn--grande">
                Criar conta grátis
              </Link>
              <p className="hv-final-nota">
                Já tem conta? <Link to="/login">Entrar</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="hv-rodape hv-floresta">
        <div className="hv-container hv-rodape-grade">
          <Logo variante="horizontal" claro titulo="Agendly" />
          <nav className="hv-rodape-links" aria-label="Rodapé">
            <Link to="/login">Entrar</Link>
            <Link to="/register">Criar conta</Link>
            <Link to="/politicas-de-privacidade">Privacidade</Link>
            <Link to="/termos-de-uso">Termos de uso</Link>
          </nav>
          <span className="hv-rodape-copy">© 2026 Agendly</span>
        </div>
      </footer>
    </div>
  );
}
