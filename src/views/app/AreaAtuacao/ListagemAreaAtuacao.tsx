// @requisito RE-05 RO-20
import React from "react";
import { PaginaListagem } from "@/components/ds";
import { areasAtuacaoService } from "@/services/endpoints";

export default function ListagemAreaAtuacao() {
  return (
    <PaginaListagem
      titulo="Áreas de atuação"
      descricao="Setores que agrupam os serviços de cada loja."
      novo={{ to: "/cadastro-area-atuacao", rotulo: "Nova área" }}
      buscar={() => areasAtuacaoService.listar()}
      chaveItem={(a) => a.id}
      buscaPlaceholder="Buscar por área ou loja"
      contextoCarregando="Carregando áreas..."
      vazio={{
        titulo: "Nenhuma área cadastrada",
        texto: "Áreas são necessárias para cadastrar serviços.",
      }}
      filtrar={(a, termo) =>
        `${a.nome ?? ""} ${a.descricao ?? ""} ${a.nomeLoja ?? ""}`.toLowerCase().includes(termo)
      }
      colunas={[
        { chave: "nome", titulo: "Área", principal: true },
        { chave: "descricao", titulo: "Descrição", render: (a) => a.descricao || "—" },
        { chave: "nomeLoja", titulo: "Loja", render: (a) => a.nomeLoja || "—" },
      ]}
    />
  );
}
