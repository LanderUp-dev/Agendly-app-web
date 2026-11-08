// @requisito RE-11 RO-24
import React from "react";
import { PaginaListagem } from "@/components/ds";
import { cobrancistasService } from "@/services/endpoints";
import { formatarTelefone } from "@/lib/formatadores";

export default function ListagemCobrancista() {
  return (
    <PaginaListagem
      titulo="Cobrancistas"
      descricao="Contatos responsáveis pelas cobranças."
      novo={{ to: "/cadastro-cobrancista", rotulo: "Novo cobrancista" }}
      buscar={() => cobrancistasService.listar()}
      chaveItem={(c) => c.id}
      buscaPlaceholder="Buscar por nome, e-mail ou loja"
      contextoCarregando="Carregando cobrancistas..."
      vazio={{ titulo: "Nenhum cobrancista cadastrado" }}
      filtrar={(c, termo) =>
        `${c.nome ?? ""} ${c.email ?? ""} ${c.nomeLoja ?? ""}`.toLowerCase().includes(termo)
      }
      colunas={[
        { chave: "nome", titulo: "Nome", principal: true },
        {
          chave: "contato",
          titulo: "Contato",
          render: (c) => (
            <span className="celula-dupla">
              <span>{c.email || "—"}</span>
              <span>
                {[formatarTelefone(c.celular), c.telefone ? formatarTelefone(c.telefone) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
          ),
        },
        { chave: "nomeLoja", titulo: "Loja", render: (c) => c.nomeLoja || "—" },
        { chave: "descricao", titulo: "Observações", render: (c) => c.descricao || "—" },
      ]}
    />
  );
}
