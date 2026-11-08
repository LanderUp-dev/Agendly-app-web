// @requisito RO-35 RS-07
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import {
  Badge,
  Button,
  Carregando,
  DataTable,
  FormField,
  Modal,
  PageHeader,
} from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import {
  adminService,
  descreverAcesso,
  type LojaAdmin,
  type SituacaoAcesso,
} from "@/services/acesso";

const tomDoAcesso = (a: SituacaoAcesso) =>
  !a.temAcesso ? "erro" : a.tipo === "CORTESIA" ? "marca" : a.tipo === "TESTE" ? "aviso" : "neutro";

/**
 * Administração da plataforma (ADMIN_EMAILS): lista todas as lojas e libera
 * acesso de cortesia (grátis), com prazo opcional, ou revoga.
 */
export default function AdminLojas() {
  const navigate = useNavigate();
  const [ehAdmin, setEhAdmin] = useState<boolean | null>(null);
  const lojas = useCarregar<LojaAdmin[]>(
    () => (ehAdmin ? adminService.lojas() : Promise.resolve([])),
    [],
  );
  const [lojaCortesia, setLojaCortesia] = useState<LojaAdmin | null>(null);
  const [semPrazo, setSemPrazo] = useState(true);
  const [validoAte, setValidoAte] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    adminService
      .souAdmin()
      .then((sim) => {
        setEhAdmin(sim);
        if (!sim) {
          toast.error("Acesso restrito à administração da plataforma.");
          navigate({ to: "/listagem-lojas" });
        }
      })
      .catch(() => setEhAdmin(false));
  }, [navigate]);

  useEffect(() => {
    if (ehAdmin) lojas.recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehAdmin]);

  const abrirCortesia = (loja: LojaAdmin) => {
    setLojaCortesia(loja);
    setSemPrazo(true);
    setValidoAte("");
    setMotivo(
      loja.acesso.tipo === "CORTESIA" && !loja.acesso.revogado ? (loja.acesso.motivo ?? "") : "",
    );
    setErro(null);
  };

  const salvarCortesia = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!lojaCortesia) return;
    if (!motivo.trim()) return setErro("Informe o motivo da cortesia.");
    if (!semPrazo && !validoAte) return setErro("Escolha a data final ou marque “Sem prazo”.");
    setSalvando(true);
    try {
      await adminService.concederCortesia(
        lojaCortesia.id,
        semPrazo ? null : validoAte,
        motivo.trim(),
      );
      toast.success(`Cortesia liberada para ${lojaCortesia.nome}.`);
      setLojaCortesia(null);
      lojas.recarregar();
    } catch {
      // mensagem do backend já aparece em toast (interceptor)
    } finally {
      setSalvando(false);
    }
  };

  const revogar = async (loja: LojaAdmin) => {
    if (
      !window.confirm(`Revogar a cortesia de ${loja.nome}? A loja perde o acesso grátis na hora.`)
    )
      return;
    try {
      await adminService.revogarCortesia(loja.id);
      toast.success(`Cortesia de ${loja.nome} revogada.`);
      lojas.recarregar();
    } catch {
      // toast pelo interceptor
    }
  };

  if (ehAdmin === null) {
    return (
      <Layout>
        <Carregando ativo contexto="Verificando acesso..." />
      </Layout>
    );
  }
  if (!ehAdmin) return null;

  const hoje = new Date();
  const amanhaISO = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate() + 1,
  ).toLocaleDateString("sv-SE"); // yyyy-MM-dd

  return (
    <Layout>
      <PageHeader
        titulo="Administração: lojas"
        descricao="Libere acesso grátis (cortesia) para quem você quiser, com ou sem prazo."
      />
      <DataTable<LojaAdmin>
        rotulo="Lojas da plataforma"
        itens={lojas.dados}
        chaveItem={(l) => l.id}
        carregando={lojas.carregando}
        erro={lojas.erro}
        onTentarNovamente={lojas.recarregar}
        contextoCarregando="Carregando lojas..."
        buscaPlaceholder="Buscar por nome, e-mail ou CNPJ"
        filtrar={(l, termo) =>
          `${l.nome ?? ""} ${l.email ?? ""} ${l.cnpj ?? ""}`.toLowerCase().includes(termo)
        }
        vazio={{ titulo: "Nenhuma loja cadastrada" }}
        colunas={[
          {
            chave: "nome",
            titulo: "Loja",
            principal: true,
            render: (l) => l.nome || `Loja ${l.id}`,
          },
          { chave: "email", titulo: "E-mail", render: (l) => l.email || "—" },
          {
            chave: "acesso",
            titulo: "Acesso",
            render: (l) => (
              <span className="celula-acesso" data-cy={`acesso-loja-${l.id}`}>
                <Badge tom={tomDoAcesso(l.acesso)}>{descreverAcesso(l.acesso)}</Badge>
                {l.acesso.tipo === "CORTESIA" && l.acesso.motivo && (
                  <small>{l.acesso.motivo}</small>
                )}
              </span>
            ),
          },
          {
            chave: "acoes",
            titulo: "Ações",
            render: (l) => (
              <span className="celula-acoes">
                <Button
                  variante="secundario"
                  onClick={() => abrirCortesia(l)}
                  data-cy={`liberar-cortesia-${l.id}`}
                >
                  {l.acesso.tipo === "CORTESIA" && !l.acesso.revogado
                    ? "Alterar"
                    : "Liberar cortesia"}
                </Button>
                {l.acesso.tipo === "CORTESIA" && !l.acesso.revogado && (
                  <Button
                    variante="perigo"
                    onClick={() => revogar(l)}
                    data-cy={`revogar-cortesia-${l.id}`}
                  >
                    Revogar
                  </Button>
                )}
              </span>
            ),
          },
        ]}
      />

      <Modal
        titulo={`Cortesia para ${lojaCortesia?.nome ?? ""}`}
        aberto={!!lojaCortesia}
        onFechar={() => setLojaCortesia(null)}
        data-cy="modal-cortesia"
        rodape={
          <>
            <Button variante="secundario" onClick={() => setLojaCortesia(null)}>
              Cancelar
            </Button>
            <Button onClick={() => salvarCortesia()} disabled={salvando} data-cy="salvar-cortesia">
              {salvando ? "Salvando..." : "Liberar acesso"}
            </Button>
          </>
        }
      >
        <form onSubmit={salvarCortesia} className="form-grade" noValidate>
          <FormField
            id="cortesia-motivo"
            label="Motivo"
            obrigatorio
            erro={erro}
            colunas={12}
            ajuda="Fica registrado junto com o seu e-mail. Ex.: parceiro, beta tester, permuta."
          >
            <input
              id="cortesia-motivo"
              value={motivo}
              maxLength={200}
              onChange={(e) => setMotivo(e.target.value)}
              data-cy="cortesia-motivo"
            />
          </FormField>
          {/* Fora do FormField: o estilo de campo de texto esticaria o checkbox. */}
          <div className="opcao-inline-linha">
            <label className="opcao-inline">
              <input
                id="cortesia-sem-prazo"
                type="checkbox"
                checked={semPrazo}
                onChange={(e) => setSemPrazo(e.target.checked)}
                data-cy="cortesia-sem-prazo"
              />
              Sem prazo (vale até ser revogada)
            </label>
          </div>
          {!semPrazo && (
            <FormField id="cortesia-ate" label="Liberado até (inclusive)" colunas={6}>
              <input
                id="cortesia-ate"
                type="date"
                min={amanhaISO}
                value={validoAte}
                onChange={(e) => setValidoAte(e.target.value)}
                data-cy="cortesia-ate"
              />
            </FormField>
          )}
        </form>
      </Modal>
    </Layout>
  );
}
