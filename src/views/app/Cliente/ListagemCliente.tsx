// @requisito RE-12 RO-25
import React from "react";
import { PaginaListagem } from "@/components/ds";
import { clientesService } from "@/services/endpoints";
import { formatarCPF, formatarData, formatarTelefone, nomeCompleto } from "@/lib/formatadores";
import { somenteDigitos } from "@/lib/validators";

export default function ListagemCliente() {
  return (
    <PaginaListagem
      titulo="Clientes"
      descricao="Pessoas atendidas nas suas lojas."
      novo={{ to: "/cadastro-cliente", rotulo: "Novo cliente" }}
      buscar={() => clientesService.listar()}
      chaveItem={(c) => c.id}
      buscaPlaceholder="Buscar por nome, CPF ou e-mail"
      contextoCarregando="Carregando clientes..."
      vazio={{
        titulo: "Nenhum cliente cadastrado",
        texto: "Cadastre o primeiro cliente para começar a agendar.",
      }}
      filtrar={(c, termo) =>
        `${c.nome ?? ""} ${c.sobreNome ?? ""} ${c.email ?? ""}`.toLowerCase().includes(termo) ||
        (somenteDigitos(termo) !== "" && (c.cpf ?? "").includes(somenteDigitos(termo)))
      }
      colunas={[
        {
          chave: "nome",
          titulo: "Nome",
          principal: true,
          render: (c) => nomeCompleto(c.nome, c.sobreNome),
        },
        { chave: "cpf", titulo: "CPF", mono: true, render: (c) => formatarCPF(c.cpf) },
        {
          chave: "contato",
          titulo: "Contato",
          render: (c) => (
            <span className="celula-dupla">
              <span>{c.email || "—"}</span>
              <span>{formatarTelefone(c.celular)}</span>
            </span>
          ),
        },
        {
          chave: "dtaNascimento",
          titulo: "Nascimento",
          mono: true,
          render: (c) => formatarData(c.dtaNascimento),
        },
        { chave: "nomeLoja", titulo: "Loja", render: (c) => c.nomeLoja || "—" },
      ]}
    />
  );
}
