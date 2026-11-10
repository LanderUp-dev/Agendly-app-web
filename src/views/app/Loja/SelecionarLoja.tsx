// @requisito RO-34
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import {
  Badge,
  ButtonLink,
  Card,
  Carregando,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { obterLojaAtiva } from "@/lib/auth";
import { entrarNaLoja, listarMinhasEquipes } from "@/lib/contexto";
import { adminService } from "@/services/acesso";
import type { EquipeResumo } from "@/types/auth";

/**
 * Escolha da loja em que o usuário vai trabalhar. Os cadastros e a agenda
 * mostram sempre os dados da loja escolhida aqui.
 */
export default function SelecionarLoja() {
  const navigate = useNavigate();
  const equipes = useCarregar<EquipeResumo[]>(() => listarMinhasEquipes(), []);
  const ativa = obterLojaAtiva();
  const [entrando, setEntrando] = useState<string | null>(null);
  const [ehAdmin, setEhAdmin] = useState(false);

  useEffect(() => {
    adminService
      .souAdmin()
      .then(setEhAdmin)
      .catch(() => setEhAdmin(false));
  }, []);

  const escolher = async (equipe: EquipeResumo) => {
    if (entrando) return;
    setEntrando(equipe.id);
    try {
      const loja = await entrarNaLoja(equipe.id);
      toast.success(`Você está na loja ${loja.nomeLoja || equipe.nomeLoja}.`);
      navigate({ to: "/agenda" });
    } catch {
      // Erro de rede/servidor já aparece em toast pelo interceptor do axios.
      setEntrando(null);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Escolha a loja"
        descricao="Clientes, serviços, funcionários e agenda são sempre os da loja selecionada."
        acoes={
          <ButtonLink to="/cadastro-loja" variante="secundario">
            Nova loja
          </ButtonLink>
        }
      />

      {ehAdmin && (
        <Card className="selecionar-admin" data-cy="atalho-admin">
          <div>
            <p className="selecionar-admin__titulo">Administração da plataforma</p>
            <p className="selecionar-admin__texto">
              Você é administrador do Agendly: veja todas as lojas e libere cortesias sem precisar
              entrar em uma loja.
            </p>
          </div>
          <ButtonLink to="/admin" variante="secundario">
            Abrir administração
          </ButtonLink>
        </Card>
      )}

      {equipes.carregando && <Carregando ativo contexto="Carregando suas lojas..." />}

      {!equipes.carregando && equipes.erro && (
        <ErrorState mensagem={equipes.erro.mensagem} onTentarNovamente={equipes.recarregar} />
      )}

      {!equipes.carregando && !equipes.erro && equipes.dados.length === 0 && (
        <EmptyState
          icone={<Store size={32} strokeWidth={1.5} aria-hidden="true" />}
          titulo="Você ainda não participa de nenhuma loja"
          texto="Cadastre a sua loja ou peça ao responsável para adicionar o seu e-mail à equipe."
          acao={<ButtonLink to="/cadastro-loja">Cadastrar loja</ButtonLink>}
        />
      )}

      {!equipes.carregando && !equipes.erro && equipes.dados.length > 0 && (
        <ul className="lista-lojas" data-cy="lista-lojas">
          {equipes.dados.map((equipe) => {
            const atual = ativa?.equipeId === equipe.id;
            return (
              <li key={equipe.id}>
                <Card className="lista-lojas__item">
                  <button
                    type="button"
                    className="lista-lojas__botao"
                    onClick={() => escolher(equipe)}
                    disabled={!!entrando}
                    aria-current={atual ? "true" : undefined}
                    data-cy="selecionar-loja"
                  >
                    <span className="lista-lojas__nome">
                      {equipe.nomeLoja || `Loja ${equipe.idLoja}`}
                    </span>
                    <span className="lista-lojas__meta">
                      {equipe.nomeCargo && <Badge>{equipe.nomeCargo}</Badge>}
                      {atual && <Badge tom="marca">Atual</Badge>}
                      {entrando === equipe.id && <span>Entrando...</span>}
                    </span>
                  </button>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Layout>
  );
}
