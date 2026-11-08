// @requisito RE-02 RR-01
import React from "react";
import { PaginaListagem } from "@/components/ds";
import { lojasService } from "@/services/endpoints";
import { formatarCNPJ, formatarTelefone } from "@/lib/formatadores";
import { somenteDigitos } from "@/lib/validators";

export default function ListagemLoja() {
  return (
    <PaginaListagem
      titulo="Lojas"
      descricao="Unidades onde os atendimentos acontecem."
      novo={{ to: "/cadastro-loja", rotulo: "Nova loja" }}
      buscar={() => lojasService.listar()}
      chaveItem={(l) => l.id}
      buscaPlaceholder="Buscar por nome, cidade ou CNPJ"
      contextoCarregando="Carregando lojas..."
      vazio={{
        titulo: "Nenhuma loja cadastrada",
        texto: "Cadastre a primeira loja para liberar os demais cadastros.",
      }}
      filtrar={(l, termo) =>
        `${l.nome ?? ""} ${l.cidade ?? ""} ${l.bairro ?? ""}`.toLowerCase().includes(termo) ||
        (somenteDigitos(termo) !== "" && (l.cnpj ?? "").includes(somenteDigitos(termo)))
      }
      colunas={[
        { chave: "nome", titulo: "Loja", principal: true },
        { chave: "cnpj", titulo: "CNPJ", mono: true, render: (l) => formatarCNPJ(l.cnpj) },
        {
          chave: "endereco",
          titulo: "Endereço",
          render: (l) => (
            <span className="celula-dupla">
              <span>{[l.logradouro, l.numero].filter(Boolean).join(", ") || "—"}</span>
              <span>
                {[l.bairro, l.cidade && `${l.cidade}/${l.estado ?? ""}`]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          ),
        },
        {
          chave: "contato",
          titulo: "Contato",
          render: (l) => (
            <span className="celula-dupla">
              <span>{l.email || "—"}</span>
              <span>{formatarTelefone(l.celular)}</span>
            </span>
          ),
        },
      ]}
    />
  );
}
