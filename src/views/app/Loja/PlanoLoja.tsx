// @requisito RE-14 RO-35 RO-36
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Badge, Button, Card, Carregando, ErrorState, PageHeader } from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { obterLojaAtiva } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";
import {
  acessoService,
  descreverAcesso,
  type PlanoPublico,
  type SituacaoAcesso,
} from "@/services/acesso";

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Situação de acesso da loja ativa (teste, cortesia, assinatura) e os planos para assinar. */
export default function PlanoLoja() {
  const loja = obterLojaAtiva();
  const situacao = useCarregar<SituacaoAcesso | null>(() => acessoService.situacaoDaLoja(), null);
  const planos = useCarregar<PlanoPublico[]>(() => acessoService.planos(), []);
  const [gerando, setGerando] = useState<number | null>(null);
  const podeAssinar = temPermissao("ASSINATURA_GERENCIAR");

  const assinar = async (plano: PlanoPublico) => {
    setGerando(plano.id);
    try {
      const { linkCheckout } = await acessoService.gerarLinkAssinatura(plano.id);
      window.location.href = linkCheckout;
    } catch {
      setGerando(null); // mensagem pelo interceptor
    }
  };

  const s = situacao.dados;

  return (
    <Layout>
      <PageHeader
        titulo="Plano da loja"
        descricao={loja ? `Situação de acesso de “${loja.nomeLoja}”.` : undefined}
      />

      {situacao.carregando && <Carregando ativo contexto="Carregando situação..." />}
      {!situacao.carregando && situacao.erro && (
        <ErrorState mensagem={situacao.erro.mensagem} onTentarNovamente={situacao.recarregar} />
      )}
      {s && (
        <Card data-cy="situacao-acesso">
          <p>
            <Badge tom={!s.temAcesso ? "erro" : s.tipo === "CORTESIA" ? "marca" : "neutro"}>
              {descreverAcesso(s)}
            </Badge>
          </p>
          {s.tipo === "CORTESIA" && s.temAcesso && (
            <p>Sua loja tem acesso liberado pela equipe do Agendly. Não há nada a pagar.</p>
          )}
          {s.tipo === "TESTE" && s.temAcesso && (
            <p>Você está no período de teste grátis. Assine um plano para continuar depois dele.</p>
          )}
          {s.assinaturaStatus === "pending" && s.tipo !== "ASSINATURA" && (
            <p data-cy="assinatura-pendente">
              Recebemos seu pedido de assinatura. O acesso é liberado assim que o Mercado Pago
              confirmar o pagamento (normalmente em poucos minutos). Atualize esta página depois.
            </p>
          )}
          {s.tipo === "ASSINATURA" && s.temAcesso && (
            <p>Assinatura ativa. A renovação é automática todo mês pelo Mercado Pago.</p>
          )}
          {!s.temAcesso && (
            <p>
              {s.bloqueioAtivo
                ? "O acesso está suspenso. Assine um plano para voltar a usar a agenda e os cadastros."
                : "O período de acesso terminou. Assine um plano para continuar."}
            </p>
          )}
        </Card>
      )}

      {s?.tipo !== "CORTESIA" && (
        <section aria-labelledby="titulo-planos" className="lista-planos">
          <h2 id="titulo-planos">Planos</h2>
          {!podeAssinar && <p>Só quem gerencia a loja pode assinar. Fale com o responsável.</p>}
          <ul className="lista-lojas">
            {planos.dados.map((p) => (
              <li key={p.id}>
                <Card>
                  <h3>{p.nome}</h3>
                  <p>
                    <strong>{reais(Number(p.valorMensal))}</strong> por mês
                    {p.limiteProfissionais
                      ? ` · até ${p.limiteProfissionais} profissional(is)`
                      : ""}
                  </p>
                  {p.descricao && <p>{p.descricao}</p>}
                  {podeAssinar && (
                    <Button
                      onClick={() => assinar(p)}
                      disabled={gerando !== null}
                      data-cy={`assinar-${p.codigo}`}
                    >
                      {gerando === p.id ? "Abrindo pagamento..." : `Assinar ${p.nome}`}
                    </Button>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Layout>
  );
}
