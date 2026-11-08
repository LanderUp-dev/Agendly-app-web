// @requisito RE-03 RO-18 RNR-13 RNR-14 RNR-22
import React from "react";
import { PaginaListagem } from "@/components/ds";
import { servicosService } from "@/services/endpoints";
import { formatarMoeda } from "@/lib/formatadores";

export default function ListagemServico() {
  return (
    <PaginaListagem
      titulo="Serviços"
      descricao="O que pode ser agendado, com preço e comissão."
      novo={{ to: "/cadastro-servico", rotulo: "Novo serviço" }}
      buscar={() => servicosService.listar()}
      chaveItem={(s) => s.id}
      buscaPlaceholder="Buscar por serviço, área ou loja"
      contextoCarregando="Carregando serviços..."
      vazio={{
        titulo: "Nenhum serviço cadastrado",
        texto: "Antes, cadastre uma loja e uma área de atuação.",
      }}
      filtrar={(s, termo) =>
        `${s.nome ?? ""} ${s.nomeArea ?? ""} ${s.nomeLoja ?? ""}`.toLowerCase().includes(termo)
      }
      colunas={[
        { chave: "nome", titulo: "Serviço", principal: true },
        { chave: "preco", titulo: "Preço", mono: true, render: (s) => formatarMoeda(s.preco) },
        {
          chave: "duracaoMinutos",
          titulo: "Duração",
          mono: true,
          render: (s) => (s.duracaoMinutos ? `${s.duracaoMinutos} min` : "30 min (padrão)"),
        },
        {
          chave: "comissaoLoja",
          titulo: "Comissão",
          mono: true,
          render: (s) =>
            s.comissaoLoja === null || s.comissaoLoja === undefined ? "—" : `${s.comissaoLoja}%`,
        },
        { chave: "nomeArea", titulo: "Área", render: (s) => s.nomeArea || "—" },
        { chave: "nomeLoja", titulo: "Loja", render: (s) => s.nomeLoja || "—" },
      ]}
    />
  );
}
