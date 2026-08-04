// @ts-nocheck
// caminho: src/views/app/Equipe/CadastroEquipe.jsx
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { funcionariosService, lojasService } from '@/services/endpoints';
import { CardCrud } from '@/components/cards/CardCrud';
import { SaveButton } from '@/components/buttons/save/SaveButton';

export default function CadastroEquipe() {
  const [formData, setFormData] = useState({ idUsuario: '', idLoja: '' });
  const [funcionarios, setFuncionarios] = useState([]);
  const [lojas, setLojas] = useState([]);

  useEffect(() => {
    // Simula carregamento assíncrono dos dados de referência
    setTimeout(() => {
      funcionariosService.listar().then((d) => setFuncionarios(Array.isArray(d) ? d : d?.content ?? [])).catch(() => {});
      lojasService.listar().then((d) => setLojas(Array.isArray(d) ? d : d?.content ?? [])).catch(() => {});
    }, 300);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    console.log("Enviando EquipeDTO:", {
      idUsuario: Number(formData.idUsuario),
      idLoja: Number(formData.idLoja)
    });
    alert("Vínculo de equipe salvo com sucesso!");
  };

  return (
    <Layout title="Agendly">
      <CardCrud>
        <div className="crud-header">
          <h2 className="crud-titulo-pagina">Vincular Equipe</h2>
          <p className="crud-subtitulo-pagina">Selecione um funcionário e a loja para criar o vínculo.</p>
        </div>

        <form className="form-container" onSubmit={handleSalvar}>
          <div className="form-linha">
            <div className="campo-wrapper">
              <label>Funcionário (Usuário)</label>
              <select name="idUsuario" value={formData.idUsuario} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {funcionarios.map(func => (
                  <option key={func.id} value={func.id}>{func.nome}</option>
                ))}
              </select>
            </div>

            <div className="campo-wrapper">
              <label>Unidade (Loja)</label>
              <select name="idLoja" value={formData.idLoja} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {lojas.map(loja => (
                  <option key={loja.id} value={loja.id}>{loja.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <SaveButton label="VINCULAR FUNCIONÁRIO" />
          </div>
        </form>
      </CardCrud>
    </Layout>
  );
}