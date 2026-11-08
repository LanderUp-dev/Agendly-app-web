// @requisito RR-07 RR-08
import React, { useState } from "react";
import { toast } from "sonner";
import { Info } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { areasAtuacaoService, funcionariosService } from "@/services/endpoints";
import { Button, ButtonLink, Card, PageHeader, SelectCarregado } from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";

/**
 * O backend ainda não expõe um endpoint para criar o vínculo Área x Funcionário
 * (existe a entidade/serviço AreaFuncionario, mas não há controller).
 * A tela continua disponível para consulta, mas não finge que salvou.
 */
const VINCULO_DISPONIVEL_NA_API = false;

export default function CadastroAreaFuncionario() {
  const [formData, setFormData] = useState({ idArea: "", idFuncionario: "" });
  const areas = useCarregar(() => areasAtuacaoService.listar(), []);
  const funcionarios = useCarregar(() => funcionariosService.listar(), []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("O vínculo entre área e funcionário ainda não está disponível no servidor.");
  };

  return (
    <Layout>
      <PageHeader
        titulo="Especialidade do funcionário"
        descricao="Liga um profissional a uma área de atuação."
        voltar={{ to: "/listagem-areas-funcionario", rotulo: "Especialidades" }}
      />
      <Card como="section" className="form-card">
        {!VINCULO_DISPONIVEL_NA_API && (
          <div
            role="status"
            className="alerta alerta-aviso"
            style={{ marginBottom: "var(--esp-6)" }}
            data-cy="aviso-indisponivel"
          >
            <Info
              size={18}
              strokeWidth={1.75}
              aria-hidden="true"
              style={{ flexShrink: 0, marginTop: 2 }}
            />
            <span>
              Ainda indisponível: o servidor não tem como salvar este vínculo. Você pode consultar
              as listas, mas nada será gravado.
            </span>
          </div>
        )}

        <form onSubmit={handleSalvar} noValidate data-cy="form-area-funcionario">
          <div className="form-grade">
            <SelectCarregado
              id="campo-idArea"
              name="idArea"
              label="Área de atuação"
              colunas={6}
              value={formData.idArea}
              onChange={handleChange}
              itens={areas.dados}
              carregando={areas.carregando}
              erroCarregamento={areas.erro}
              onTentarNovamente={areas.recarregar}
              valorItem={(a) => a.id}
              rotuloItem={(a) => a.nome}
              nomePlural="áreas"
              vazioTexto="Nenhuma área cadastrada."
            />
            <SelectCarregado
              id="campo-idFuncionario"
              name="idFuncionario"
              label="Funcionário"
              colunas={6}
              value={formData.idFuncionario}
              onChange={handleChange}
              itens={funcionarios.dados}
              carregando={funcionarios.carregando}
              erroCarregamento={funcionarios.erro}
              onTentarNovamente={funcionarios.recarregar}
              valorItem={(f) => f.id}
              rotuloItem={(f) => [f.nome, f.sobrenome].filter(Boolean).join(" ")}
              nomePlural="funcionários"
              vazioTexto="Nenhum funcionário cadastrado."
            />
          </div>

          <div className="form-rodape">
            <ButtonLink to="/listagem-areas-funcionario" variante="secundario">
              Voltar
            </ButtonLink>
            <Button type="submit" disabled={!VINCULO_DISPONIVEL_NA_API} data-cy="form-salvar">
              Vincular especialidade
            </Button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
