import React from 'react';
import { Link } from '@tanstack/react-router';
import './LegalPage.css';

export default function TermosDeUso() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-voltar">← Voltar para o início</Link>

        <h1 className="legal-titulo">Termos de Uso</h1>
        <p className="legal-atualizacao">Última atualização: 02/08/2026</p>

        <section>
          <h2>1. Aceitação</h2>
          <p>
            Ao criar uma conta ou utilizar o Agendly, você concorda com estes Termos de Uso
            e com a nossa Política de Privacidade. Se não concordar, não utilize a plataforma.
          </p>
        </section>

        <section>
          <h2>2. O serviço</h2>
          <p>
            O Agendly é uma plataforma online para profissionais da área estética e de beleza
            gerenciarem agendamentos, clientes, serviços e vendas, com uma página de
            agendamento para seus clientes. Oferecemos um plano Gratuito e planos pagos
            (Pro e Equipe), com recursos e limites distintos descritos na página de planos.
          </p>
        </section>

        <section>
          <h2>3. Cadastro e conta</h2>
          <ul>
            <li>Você deve ter ao menos 18 anos e fornecer informações verdadeiras e atualizadas.</li>
            <li>Você é responsável por manter a confidencialidade da sua senha e por toda atividade na sua conta.</li>
            <li>Avise-nos imediatamente em caso de uso não autorizado.</li>
          </ul>
        </section>

        <section>
          <h2>4. Planos, assinatura e pagamento</h2>
          <ul>
            <li>Os planos pagos são cobrados de forma recorrente (mensal, trimestral ou semestral) por meio do Mercado Pago.</li>
            <li>Planos pagos podem incluir 7 dias de teste grátis; após o período, a cobrança é iniciada automaticamente, salvo cancelamento.</li>
            <li>Você pode cancelar a qualquer momento pelo portal de assinatura; o acesso pago permanece até o fim do período já pago.</li>
            <li>Salvo disposição legal em contrário, valores já pagos não são reembolsados proporcionalmente.</li>
            <li>Os preços podem ser alterados, com aviso prévio razoável.</li>
          </ul>
        </section>

        <section>
          <h2>5. Suas responsabilidades</h2>
          <ul>
            <li>Usar a plataforma de forma lícita e não violar direitos de terceiros.</li>
            <li>Ao cadastrar dados de seus clientes, você declara ter base legal para isso e ser o Controlador desses dados, nos termos da LGPD, cabendo a você informá-los adequadamente.</li>
            <li>Não usar a plataforma para spam, conteúdo ilegal ou que infrinja direitos autorais.</li>
            <li>Você é responsável pelo conteúdo que envia (textos, imagens de portfólio), garantindo que possui os direitos necessários.</li>
          </ul>
        </section>

        <section>
          <h2>6. Proteção de dados (LGPD)</h2>
          <p>
            O tratamento de dados pessoais é regido pela nossa Política de Privacidade, em
            conformidade com a Lei nº 13.709/2018. Em relação aos dados dos seus clientes, o
            Agendly atua como Operador e você como Controlador.
          </p>
        </section>

        <section>
          <h2>7. Disponibilidade</h2>
          <p>
            Empenhamo-nos para manter o serviço disponível, mas ele é fornecido "como está",
            sem garantia de funcionamento ininterrupto ou livre de erros. Podemos realizar
            manutenções e atualizações.
          </p>
        </section>

        <section>
          <h2>8. Limitação de responsabilidade</h2>
          <p>
            Na máxima extensão permitida pela lei, o Agendly não se responsabiliza por danos
            indiretos, lucros cessantes ou perda de dados decorrentes do uso ou da
            impossibilidade de uso da plataforma. O Agendly organiza a agenda e a gestão, mas
            não processa os pagamentos dos seus clientes — a cobrança de cada atendimento é
            feita por você, diretamente.
          </p>
        </section>

        <section>
          <h2>9. Propriedade intelectual</h2>
          <p>
            A marca, o software e os elementos visuais do Agendly pertencem aos seus
            titulares. Você recebe uma licença limitada, não exclusiva e intransferível para
            usar a plataforma, sem direito de copiar, modificar ou redistribuir o sistema.
          </p>
        </section>

        <section>
          <h2>10. Encerramento</h2>
          <p>
            Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar
            contas que violem estes Termos. Em caso de encerramento, seus dados serão
            tratados conforme a Política de Privacidade.
          </p>
        </section>

        <section>
          <h2>11. Alterações dos Termos</h2>
          <p>
            Podemos atualizar estes Termos periodicamente. Mudanças relevantes serão
            comunicadas, e o uso continuado após a atualização implica concordância.
          </p>
        </section>

        <section>
          <h2>12. Lei aplicável e foro</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica
            eleito o foro do domicílio do consumidor para dirimir eventuais controvérsias.
          </p>
        </section>

        <section>
          <h2>13. Contato</h2>
          <p>
            Dúvidas sobre estes Termos: <a href="mailto:suporte@agendly.com">suporte@agendly.com</a>
          </p>
        </section>
      </div>
    </div>
  );
}