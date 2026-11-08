// @requisito RO-28 RR-45
import React from "react";
import { PaginaListagem } from "@/components/ds";
import { equipesService } from "@/services/endpoints";

export default function ListagemEquipe() {
  return (
    <PaginaListagem
      titulo="Equipes"
      descricao="Contas de usuário com acesso à loja atual."
      novo={{ to: "/cadastro-equipe", rotulo: "Adicionar pessoa" }}
      buscar={() => equipesService.listar()}
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
        { chave: "nomeCargo", titulo: "Cargo", render: (e) => e.nomeCargo || "—" },
      ]}
    />
  );
}
