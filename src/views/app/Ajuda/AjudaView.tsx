import React from "react";
import { Link } from "@tanstack/react-router";
import { Layout } from "@/components/layout/Layout";
import { Card, PageHeader } from "@/components/ds";
import "./Ajuda.css";

interface Guia {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: React.ReactNode;
}

const Passo = ({ children }: { children: React.ReactNode }) => <li>{children}</li>;

/**
 * Tutoriais curtos, em linguagem de salão. Cada guia abre e fecha sozinho (details/summary):
 * funciona sem JavaScript e com teclado. Os links levam direto para a tela citada.
 * Regra: só explica o que o sistema faz hoje.
 */
const GUIAS: Guia[] = [
  {
    id: "primeiros-passos",
    titulo: "Primeiros passos",
    resumo: "O que cadastrar, e em que ordem, para a agenda funcionar.",
    conteudo: (
      <>
        <p>Cadastre nesta ordem. Cada passo usa o anterior:</p>
        <ol>
          <Passo>
            <Link to="/listagem-areas-atuacao">Áreas</Link>: os tipos de serviço da loja, como
            Cabelo, Barba ou Unhas.
          </Passo>
          <Passo>
            <Link to="/listagem-funcionarios">Funcionários</Link>: quem atende. Cada um vira uma
            coluna da agenda. Você também atende? Use o botão <strong>Eu também atendo</strong>.
          </Passo>
          <Passo>
            <Link to="/listagem-areas-funcionario">Especialidades</Link>: diga quais áreas cada
            funcionário atende. Quem não tem especialidade marcada pode fazer qualquer serviço.
          </Passo>
          <Passo>
            <Link to="/listagem-servicos">Serviços</Link>: nome, preço, duração e a comissão.
          </Passo>
          <Passo>
            <Link to="/horarios-loja">Horários de funcionamento</Link>: os dias e horas em que a
            loja atende. Fora deles o sistema não deixa agendar.
          </Passo>
        </ol>
        <p>
          Pronto: abra a <Link to="/agenda">Agenda</Link> e marque o primeiro horário.
        </p>
      </>
    ),
  },
  {
    id: "acesso",
    titulo: "Quem entra no sistema: funcionário e equipe",
    resumo: "Funcionário aparece na agenda. Equipe é quem tem login. São cadastros diferentes.",
    conteudo: (
      <>
        <div className="ajuda-comparacao">
          <div>
            <h3>Funcionário</h3>
            <p>
              É quem <strong>atende o cliente</strong>. Aparece como coluna na agenda e recebe
              comissão. É só um cadastro: <strong>não tem login</strong>.
            </p>
            <p>
              <Link to="/listagem-funcionarios">Ver funcionários</Link>
            </p>
          </div>
          <div>
            <h3>Equipe</h3>
            <p>
              É quem <strong>entra no Agendly</strong>. Cada pessoa tem a própria conta (e-mail e
              senha) e um cargo na loja. O cargo define o que ela pode ver e fazer.
            </p>
            <p>
              <Link to="/listagem-equipes">Ver equipe</Link>
            </p>
          </div>
        </div>

        <h3>Como dar acesso a alguém</h3>
        <ol>
          <Passo>
            A pessoa cria a própria conta em <strong>Criar conta</strong>, na tela de entrada.
          </Passo>
          <Passo>
            Você abre <Link to="/cadastro-equipe">Equipe &gt; Adicionar à equipe</Link>, informa o
            e-mail dessa conta e escolhe o cargo.
          </Passo>
          <Passo>No próximo acesso, a loja aparece para ela.</Passo>
        </ol>

        <h3>Cargos</h3>
        <ul>
          <li>
            <strong>Gerente</strong>: pode tudo. Quem cria a loja começa como gerente.
          </li>
          <li>
            <strong>Colaborador</strong>: acesso reduzido, para o dia a dia do atendimento.
          </li>
          <li>
            <strong>Cargos próprios</strong>: em <Link to="/cargos">Cargos e permissões</Link> você
            duplica um cargo e escolhe as permissões. Exemplo: uma recepção que vê a agenda e o
            caixa, mas não os salários.
          </li>
        </ul>

        <h3>Uma pessoa pode ser as duas coisas?</h3>
        <p>
          Sim. Quem atende e também usa o sistema precisa dos dois: o cadastro de funcionário (para
          ter a coluna na agenda) e a conta na equipe (para entrar). Se é você, o botão{" "}
          <strong>Eu também atendo</strong>, em{" "}
          <Link to="/cadastro-funcionario">Novo funcionário</Link>, cria o seu cadastro de
          funcionário com os dados da sua conta.
        </p>
        <p className="texto-ajuda">
          Hoje, quem entra com uma conta da equipe vê a agenda da loja de acordo com o cargo. Ainda
          não existe a visão em que cada profissional enxerga só os próprios horários e ganhos.
        </p>
      </>
    ),
  },
  {
    id: "agenda",
    titulo: "Agenda e confirmação pelo WhatsApp",
    resumo: "Marcar, mudar, confirmar com um toque do cliente e fechar o atendimento.",
    conteudo: (
      <>
        <ul>
          <li>
            <strong>Marcar:</strong> na <Link to="/agenda">Agenda</Link>, toque num horário vazio na
            coluna do profissional e escolha cliente e serviço. O fim do horário sai da duração do
            serviço.
          </li>
          <li>
            <strong>Confirmar com o cliente:</strong> abra o agendamento e toque em{" "}
            <strong>Enviar confirmação pelo WhatsApp</strong>. A mensagem sai do WhatsApp da loja e
            leva um link. O cliente toca em <strong>Sim, confirmo</strong> e o horário fica
            confirmado sozinho, com aviso no sininho.
          </li>
          <li>
            <strong>Cliente não pode ir:</strong> pelo mesmo link ele toca em{" "}
            <strong>Não vou poder ir</strong>. O horário é cancelado e fica livre de novo.
          </li>
          <li>
            <strong>Respondeu por texto?</strong> Marque você mesmo, no agendamento, como confirmado
            ou cancelado.
          </li>
          <li>
            <strong>Atendeu:</strong> no agendamento, toque em{" "}
            <strong>Fechar atendimento e receber</strong>.
          </li>
        </ul>
        <p className="texto-ajuda">
          O sistema não lê as mensagens do WhatsApp e ainda não envia lembretes sozinho: quem envia
          a confirmação é a loja.
        </p>
      </>
    ),
  },
  {
    id: "agendamento-online",
    titulo: "Agendamento online (o cliente marca sozinho)",
    resumo: "Um link da loja com os horários livres de verdade.",
    conteudo: (
      <>
        <ol>
          <Passo>
            Abra <Link to="/agendamento-online">Agendamento online</Link>, marque{" "}
            <strong>Aceitar agendamentos pelo link</strong> e salve.
          </Passo>
          <Passo>
            Copie o link e divulgue: na bio, no status ou na mensagem de saudação do WhatsApp
            Business.
          </Passo>
          <Passo>
            O cliente escolhe serviço, profissional, dia e horário, informa nome e celular e pronto.
            O agendamento entra na agenda e aparece no sininho.
          </Passo>
        </ol>
        <ul>
          <li>Só aparecem horários livres, dentro do horário de funcionamento.</li>
          <li>
            Você escolhe a <strong>antecedência mínima</strong> e até quantos dias à frente a agenda
            abre.
          </li>
          <li>Cada celular pode ter até 3 horários futuros marcados pela página.</li>
          <li>Se o cliente cancelar pelo link dele, o horário volta a aparecer para os outros.</li>
        </ul>
      </>
    ),
  },
  {
    id: "caixa",
    titulo: "Caixa e recebimento",
    resumo: "Abrir o caixa, receber em Pix, dinheiro ou cartão e fechar no fim do dia.",
    conteudo: (
      <ul>
        <li>
          <strong>Abrir:</strong> no <Link to="/caixa">Caixa</Link>, abra o caixa no começo do dia
          com o valor que está na gaveta.
        </li>
        <li>
          <strong>Receber:</strong> ao fechar um atendimento, escolha a forma de pagamento. Dá para
          dividir (parte no Pix, parte em dinheiro) e o troco é calculado.
        </li>
        <li>
          <strong>Suprimento e sangria:</strong> registre quando colocar ou tirar dinheiro da
          gaveta.
        </li>
        <li>
          <strong>Fechar:</strong> no fim do dia, feche o caixa conferindo o dinheiro. Se esquecer,
          o sininho avisa no dia seguinte.
        </li>
      </ul>
    ),
  },
  {
    id: "financeiro",
    titulo: "Financeiro: painel, despesas, fiado e salários",
    resumo: "Onde ver quanto entrou, o que falta pagar e quanto cada profissional recebe.",
    conteudo: (
      <ul>
        <li>
          <Link to="/painel">Painel</Link>: faturamento, atendimentos e ticket médio, por dia, por
          profissional, por serviço e por forma de pagamento.
        </li>
        <li>
          <Link to="/despesas">Despesas</Link>: contas a pagar, com parcelas e vencimento.
        </li>
        <li>
          <Link to="/recebimentos">Recebimentos</Link>: o fiado, ou seja, o que os clientes ficaram
          de pagar.
        </li>
        <li>
          <Link to="/salarios">Salários</Link>: a comissão de cada profissional pelos atendimentos
          fechados, menos os adiantamentos.
        </li>
      </ul>
    ),
  },
  {
    id: "plano",
    titulo: "Plano e conta",
    resumo: "Teste grátis, assinatura e os seus dados de acesso.",
    conteudo: (
      <ul>
        <li>
          Toda loja nova tem <strong>14 dias de teste</strong>. Em{" "}
          <Link to="/plano">Plano e assinatura</Link> você vê quanto falta e assina.
        </li>
        <li>
          Em <Link to="/conta">Minha conta</Link> você muda seu nome, celular e senha.
        </li>
        <li>
          Tem mais de uma loja? Troque em <Link to="/selecionar-loja">Trocar de loja</Link>.
        </li>
      </ul>
    ),
  },
];

export default function AjudaView() {
  return (
    <Layout>
      <PageHeader
        titulo="Ajuda e tutoriais"
        descricao="Guias rápidos para o dia a dia. Toque num assunto para abrir."
      />
      <nav className="ajuda-indice" aria-label="Assuntos">
        {GUIAS.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="ajuda-indice__item">
            {g.titulo}
          </a>
        ))}
      </nav>
      <div className="ajuda-guias" data-cy="ajuda">
        {GUIAS.map((g, i) => (
          <Card key={g.id} como="section" className="ajuda-guia">
            <details id={g.id} open={i === 0} data-cy={`ajuda-${g.id}`}>
              <summary>
                <span className="ajuda-guia__titulo">{g.titulo}</span>
                <span className="ajuda-guia__resumo">{g.resumo}</span>
              </summary>
              <div className="ajuda-guia__corpo">{g.conteudo}</div>
            </details>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
