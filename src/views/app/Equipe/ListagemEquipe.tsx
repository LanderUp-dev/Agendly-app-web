// @requisito RO-28 RR-45 RO-29
import React, { useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Button, Modal, PaginaListagem } from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { temPermissao } from "@/lib/permissoes";
import {
  cargosService,
  equipeCargoService,
  type Cargo,
  type MembroEquipe,
} from "@/services/cargos";
import { podeDarCargo, rotuloCargo } from "./cargoEquipe";
import "../Financeiro/Financeiro.css";

const mensagemDaApi = (err: unknown) => {
  const dados = isAxiosError(err) ? err.response?.data : undefined;
  return typeof dados === "string" && dados.length < 400 ? dados : "";
};

/** Membros da loja; quem tem EQUIPE_EDITAR muda o cargo (lista de GET /cargos). */
export default function ListagemEquipe() {
  const podeEditar = temPermissao("EQUIPE_EDITAR");
  const cargos = useCarregar<Cargo[]>(
    () => (podeEditar ? cargosService.listar() : Promise.resolve([])),
    [],
  );
  // PaginaListagem carrega a lista sozinha: mudar a key recarrega depois de trocar o cargo.
  const [versao, setVersao] = useState(0);
  const [membro, setMembro] = useState<MembroEquipe | null>(null);
  const [idCargo, setIdCargo] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const abrir = (m: MembroEquipe) => {
    setMembro(m);
    setIdCargo(m.idCargo ? String(m.idCargo) : "");
    setErro("");
  };

  const salvar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!membro) return;
    if (!idCargo) {
      setErro("Escolha o cargo.");
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await equipeCargoService.mudarCargo(membro.id, Number(idCargo));
      toast.success("Cargo alterado. Vale para a pessoa no próximo acesso à loja.");
      setMembro(null);
      setVersao((v) => v + 1);
    } catch (err) {
      setErro(mensagemDaApi(err) || "Não foi possível mudar o cargo. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <PaginaListagem<MembroEquipe>
        key={versao}
        titulo="Equipes"
        descricao="Contas de usuário com acesso à loja atual."
        novo={{ to: "/cadastro-equipe", rotulo: "Adicionar pessoa" }}
        buscar={() => equipeCargoService.listarMembros()}
        chaveItem={(e) => e.id}
        buscaPlaceholder="Buscar por usuário ou cargo"
        contextoCarregando="Carregando equipes..."
        vazio={{
          titulo: "Ninguém na equipe ainda",
          texto: "Adicione pelo e-mail as pessoas que vão usar o Agendly nesta loja.",
        }}
        filtrar={(e, termo) =>
          `${e.nomeUsuario ?? ""} ${e.nomeCargo ?? ""}`.toLowerCase().includes(termo)
        }
        colunas={[
          {
            chave: "nomeUsuario",
            titulo: "Usuário",
            principal: true,
            render: (e) => e.nomeUsuario || "—",
          },
          { chave: "nomeLoja", titulo: "Loja", render: (e) => e.nomeLoja || "—" },
          {
            chave: "nomeCargo",
            titulo: "Cargo",
            render: (e) => (
              <span>
                <span data-cy="equipe-cargo">{e.nomeCargo || "—"}</span>
                {podeEditar && (
                  <>
                    {" · "}
                    <button
                      type="button"
                      className="link link-botao"
                      onClick={() => abrir(e)}
                      data-cy="equipe-mudar-cargo"
                    >
                      Mudar cargo<span className="sr-only"> de {e.nomeUsuario}</span>
                    </button>
                  </>
                )}
              </span>
            ),
          },
        ]}
      />

      <Modal
        titulo="Mudar cargo"
        aberto={membro !== null}
        onFechar={() => setMembro(null)}
        data-cy="modal-equipe-cargo"
        rodape={
          <>
            <Button variante="secundario" onClick={() => setMembro(null)}>
              Voltar
            </Button>
            <Button
              type="submit"
              form="form-equipe-cargo"
              carregando={salvando}
              textoCarregando="Salvando…"
              data-cy="equipe-cargo-salvar"
            >
              Salvar
            </Button>
          </>
        }
      >
        {membro && (
          <form id="form-equipe-cargo" onSubmit={salvar} noValidate className="financeiro-form">
            {erro && (
              <div className="alerta alerta-erro" role="alert" data-cy="equipe-cargo-erro">
                {erro}
              </div>
            )}
            <p>
              Cargo de <strong>{membro.nomeUsuario}</strong> nesta loja.
            </p>
            <div className="campo-wrapper">
              <label htmlFor="equipe-cargo-select">Cargo *</label>
              <select
                id="equipe-cargo-select"
                name="idCargo"
                value={idCargo}
                onChange={(e) => setIdCargo(e.target.value)}
                disabled={cargos.carregando}
                aria-describedby="equipe-cargo-ajuda"
                data-cy="equipe-cargo-select"
              >
                <option value="">{cargos.carregando ? "Carregando cargos…" : "Selecione…"}</option>
                {cargos.dados.map((c) => (
                  <option key={c.id} value={c.id} disabled={!podeDarCargo(c)}>
                    {rotuloCargo(c)}
                  </option>
                ))}
              </select>
              <p className="texto-ajuda" id="equipe-cargo-ajuda">
                {cargos.erro
                  ? "Não foi possível carregar os cargos."
                  : "As mudanças valem para cada pessoa no próximo acesso à loja."}
              </p>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
