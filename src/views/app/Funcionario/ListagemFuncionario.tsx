// @requisito RE-04 RO-19
import React from "react";
import { Badge, PaginaListagem } from "@/components/ds";
import { funcionariosService } from "@/services/endpoints";
import { formatarCPF, formatarTelefone, nomeCompleto } from "@/lib/formatadores";

export default function ListagemFuncionario() {
  return (
    <PaginaListagem
      titulo="Funcionários"
      descricao="Profissionais que aparecem como colunas na agenda."
      novo={{ to: "/cadastro-funcionario", rotulo: "Novo funcionário" }}
      buscar={() => funcionariosService.listar()}
      chaveItem={(f) => f.id}
      buscaPlaceholder="Buscar por nome, e-mail ou loja"
      contextoCarregando="Carregando funcionários..."
      vazio={{
        titulo: "Nenhum funcionário cadastrado",
        texto: "Funcionários cadastrados viram colunas da agenda.",
      }}
      filtrar={(f, termo) =>
        `${f.nome ?? ""} ${f.sobrenome ?? ""} ${f.email ?? ""} ${f.nomeLoja ?? ""}`
          .toLowerCase()
          .includes(termo)
      }
      colunas={[
        {
          chave: "nome",
          titulo: "Nome",
          principal: true,
          render: (f) => nomeCompleto(f.nome, f.sobrenome),
        },
        { chave: "cpf", titulo: "CPF", mono: true, render: (f) => formatarCPF(f.cpf) },
        {
          chave: "contato",
          titulo: "Contato",
          render: (f) => (
            <span className="celula-dupla">
              <span>{f.email || "—"}</span>
              <span>{formatarTelefone(f.celular)}</span>
            </span>
          ),
        },
        { chave: "nomeLoja", titulo: "Loja", render: (f) => f.nomeLoja || "—" },
        {
          chave: "area",
          titulo: "Especialidades",
          render: (f) =>
            f.area?.length ? (
              <span className="celula-badges">
                {f.area.map((a: { id: number; nome: string }) => (
                  <Badge key={a.id}>{a.nome}</Badge>
                ))}
              </span>
            ) : (
              "—"
            ),
        },
      ]}
    />
  );
}
