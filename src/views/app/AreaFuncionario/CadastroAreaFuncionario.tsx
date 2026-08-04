// @ts-nocheck
// caminho: src/views/app/AreaFuncionario/CadastroAreaFuncionario.jsx
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { areasAtuacaoService, funcionariosService } from '@/services/endpoints';
import { CardCrud } from '@/components/cards/CardCrud';
import { SaveButton } from '@/components/buttons/save/SaveButton';
export default function CadastroAreaFuncionario() {
  const [formData, setFormData] = useState({ idArea: '', idFuncionario: '' });
  const [areas, setAreas] = useState([]);
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    // Simulando busca assíncrona dos dados centralizados
    setTimeout(() => {
      areasAtuacaoService.listar().then((d) => setAreas(Array.isArray(d) ? d : d?.content ?? [])).catch(() => {});
      funcionariosService.listar().then((d) => setFuncionarios(Array.isArray(d) ? d : d?.content ?? [])).catch(() => {});
    }, 300);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    console.log("Alocando funcionário na área:", {
      idArea: Number(formData.idArea),
      idFuncionario: Number(formData.idFuncionario)
    });
    alert("Vinculado com sucesso!");
  };

  return (
    <Layout title="Agendly">
      <CardCrud>
        <div className="crud-header">
          <h2 className="crud-titulo-pagina">Alocar Funcionário em Área</h2>
          <p className="crud-subtitulo-pagina">Vincule um profissional a uma especialidade.</p>
        </div>

        <form className="form-container" onSubmit={handleSalvar}>
          <div className="form-linha">
            <div className="campo-wrapper">
              <label>Área de Atuação</label>
              <select name="idArea" value={formData.idArea} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.nome}</option>
                ))}
              </select>
            </div>

            <div className="campo-wrapper">
              <label>Funcionário</label>
              <select name="idFuncionario" value={formData.idFuncionario} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {funcionarios.map(func => (
                  <option key={func.id} value={func.id}>{func.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <SaveButton label="VINCULAR ESPECIALIDADE" />
          </div>
        </form>
      </CardCrud>
    </Layout>
  );
}