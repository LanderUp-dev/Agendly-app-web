// @requisito RR-07 RR-08
import React from "react";
import { Info } from "lucide-react";
import { PaginaListagem } from "@/components/ds";
import { areasFuncionarioService } from "@/services/endpoints";

export default function ListagemAreaFuncionario() {
  return (
    <PaginaListagem
      titulo="Especialidades"
      descricao="Áreas de atuação de cada profissional."
      novo={{ to: "/cadastro-area-funcionario", rotulo: "Nova especialidade" }}
      buscar={() => areasFuncionarioService.listar()}
      chaveItem={(v) => v.id}
      buscaPlaceholder="Buscar por funcionário ou área"
      contextoCarregando="Carregando especialidades..."
      vazio={{ titulo: "Nenhuma especialidade registrada" }}
      filtrar={(v, termo) =>
        `${v.nomeFuncionario ?? ""} ${v.nomeArea ?? ""}`.toLowerCase().includes(termo)
      }
      aviso={
        <div className="alerta alerta-info" role="note" style={{ marginBottom: "var(--esp-4)" }}>
          <Info
            size={18}
            strokeWidth={1.75}
            aria-hidden="true"
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <span>
            Lista montada a partir dos funcionários. O servidor ainda não permite criar ou remover
            especialidades.
          </span>
        </div>
      }
      colunas={[
        { chave: "nomeFuncionario", titulo: "Funcionário", principal: true },
        { chave: "nomeArea", titulo: "Área" },
      ]}
    />
  );
}
