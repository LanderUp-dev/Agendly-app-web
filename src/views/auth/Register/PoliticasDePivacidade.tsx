import React from 'react';
import { Link } from '@tanstack/react-router';
import './LegalPage.css';

export default function PoliticasDePivacidade() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <Link to="/" className="legal-voltar">← Voltar para o início</Link>

        <h1 className="legal-titulo">Política de Privacidade</h1>
        <p className="legal-atualizacao">
          Esta política está em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção
          de Dados — LGPD). Última atualização: 02/08/2026
        </p>

        <section>
          <h2>1. Quem somos</h2>
          <p>
            O Agendly é uma plataforma online de agendamento e gestão para profissionais de
            estética e beleza. Levamos a sua privacidade a sério e tratamos os dados pessoais
            de acordo com a LGPD. Para qualquer assunto relacionado a dados pessoais, fale com
            o nosso Encarregado pelo Tratamento de Dados (DPO) pelo e-mail{' '}
            <a href="mailto:suporte@agendly.com">suporte@agendly.com</a>.
          </p>
        </section>

        <section>
          <h2>2. Controlador e Operador — papéis</h2>
          <p>
            Em relação aos dados da sua conta (do profissional/negócio), o Agendly atua como
            Controlador. Em relação aos dados que você cadastra sobre os seus clientes (ex.:
            nome, telefone e e-mail de quem agenda com você), o Agendly atua como Operador —
            ou seja, tratamos esses dados em seu nome, e você é o Controlador deles, sendo
            responsável por ter uma base legal para coletá-los e informar seus clientes.
          </p>
        </section>

        <section>
          <h2>3. Dados que coletamos</h2>
          <p>Coletamos apenas o necessário para fornecer o serviço:</p>
          <ul>
            <li>Dados de cadastro/conta: nome, e-mail, senha (armazenada de forma criptografada), telefone/WhatsApp, nome e endereço da loja, Instagram, foto/avatar e bio.</li>
            <li>Dados dos seus clientes (inseridos por você): nome, telefone e e-mail, além do histórico de agendamentos e serviços.</li>
            <li>Agendamentos, serviços, produtos e portfólio que você cadastra.</li>
            <li>Vendas e informações financeiras do seu negócio que você registra. Não armazenamos números de cartão de crédito.</li>
            <li>Dados de pagamento da assinatura: processados com segurança pela Stripe. Guardamos apenas identificadores da assinatura (ex.: status e datas), não os dados do cartão.</li>
            <li>Dados técnicos e de uso: endereço IP, localização aproximada (cidade/região/país) derivada do IP, e eventos de navegação (páginas visitadas e cliques), usados para análise de tráfego, melhoria e segurança.</li>
            <li>Cookies e armazenamento local (ver seção 11).</li>
          </ul>
        </section>

        <section>
          <h2>4. Para que usamos e com que base legal</h2>
          <p>Tratamos seus dados com as seguintes finalidades e bases legais (art. 7º da LGPD):</p>
          <ul>
            <li>Execução do contrato: criar e manter sua conta, permitir agendamentos, gestão de clientes, vendas, portfólio e cobrança da assinatura.</li>
            <li>Legítimo interesse: segurança, prevenção a fraudes, métricas de tráfego e melhoria do produto, sempre respeitando seus direitos.</li>
            <li>Cumprimento de obrigação legal/regulatória: quando exigido por lei.</li>
            <li>Consentimento: cookies não essenciais e comunicações de marketing, que você pode revogar a qualquer momento.</li>
          </ul>
        </section>

        <section>
          <h2>5. Compartilhamento e operadores</h2>
          <p>
            Não vendemos seus dados. Compartilhamos dados apenas com prestadores que
            viabilizam o serviço (operadores), na medida do necessário:
          </p>
          <ul>
            <li>Mercado Pago — processamento de pagamentos da assinatura.</li>
            <li>DigitalOcean — hospedagem do site e envio de e-mails.</li>
            <li>Serviços de e-mail (ex.: Resend/SMTP) — envio de e-mails transacionais e de suporte.</li>
            <li>Serviços de geolocalização por IP (ex.: ipapi.co, ipwho.is) — apenas para as métricas de tráfego.</li>
            <li>Autoridades públicas, quando exigido por lei ou ordem judicial.</li>
          </ul>
        </section>

        <section>
          <h2>6. Transferência internacional</h2>
          <p>
            Alguns desses prestadores podem armazenar e processar dados em servidores fora do
            Brasil. Nesses casos, a transferência é feita em conformidade com o art. 33 da
            LGPD, adotando salvaguardas para proteger seus dados.
          </p>
        </section>

        <section>
          <h2>7. Por quanto tempo guardamos</h2>
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa e pelo tempo necessário para
            cumprir as finalidades acima ou obrigações legais. Após o encerramento da conta,
            os dados são eliminados ou anonimizados, salvo quando a retenção for exigida por
            lei.
          </p>
        </section>

        <section>
          <h2>8. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo
            criptografia de senhas, controle de acesso e regras de segurança no banco de dados
            (RLS). Nenhum sistema é 100% infalível, mas trabalhamos para reduzir riscos de
            acesso não autorizado, perda ou alteração indevida.
          </p>
        </section>

        <section>
          <h2>9. Seus direitos (art. 18 da LGPD)</h2>
          <p>A qualquer momento, você pode solicitar:</p>
          <ul>
            <li>Confirmação da existência de tratamento e acesso aos seus dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade;</li>
            <li>Portabilidade dos dados;</li>
            <li>Informação sobre com quem compartilhamos seus dados;</li>
            <li>Revogação do consentimento.</li>
          </ul>
          <p>
            Para exercer esses direitos, escreva para <a href="mailto:suporte@agendly.com">suporte@agendly.com</a>.
            Você também pode editar grande parte dos seus dados diretamente no painel e
            solicitar a exclusão da sua conta pelo mesmo e-mail.
          </p>
        </section>

        <section>
          <h2>10. Se você é cliente de um profissional</h2>
          <p>
            Se os seus dados foram cadastrados por um profissional que usa o Agendly (por
            exemplo, ao agendar um horário), o Controlador desses dados é o próprio
            profissional. Para exercer seus direitos, procure-o diretamente; se precisar,
            podemos ajudar a intermediar pelo e-mail acima.
          </p>
        </section>

        <section>
          <h2>11. Cookies</h2>
          <p>
            Usamos cookies e armazenamento local essenciais (para manter você logado e o
            sistema funcionando) e analíticos (para entender o tráfego e melhorar a
            plataforma). Você pode gerenciar cookies nas configurações do seu navegador; ao
            bloquear cookies essenciais, algumas funções podem deixar de funcionar.
          </p>
        </section>

        <section>
          <h2>12. Menores de idade</h2>
          <p>
            O Agendly é destinado a maiores de 18 anos. Não coletamos intencionalmente dados
            de menores sem o devido consentimento dos responsáveis.
          </p>
        </section>

        <section>
          <h2>13. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta Política periodicamente. Mudanças relevantes serão
            informadas pelos nossos canais, e a data da última atualização sempre constará no
            topo deste documento.
          </p>
        </section>

        <section>
          <h2>14. Contato / Encarregado (DPO)</h2>
          <p>
            Dúvidas, solicitações ou reclamações sobre dados pessoais:{' '}
            <a href="mailto:suporte@agendly.com">suporte@agendly.com</a>. Você também pode
            contatar a Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </section>
      </div>
    </div>
  );
}