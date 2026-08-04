// @ts-nocheck
// caminho: src/views/app/AreaAtuacao/CadastroAreaAtuacao.jsx
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { lojasService } from '@/services/endpoints';
import { CardCrud } from '@/components/cards/CardCrud';
import { SaveButton } from '@/components/buttons/save/SaveButton';
import './CadastroAreaAtuacao.css'; 

export default function CadastroAreaAtuacao() {
  const [formData, setFormData] = useState({
    nome: '',
    idLoja: '',
    descricao: ''
  });

  const [lojas, setLojas] = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      setTimeout(() => {
        lojasService.listar().then((d) => setLojas(Array.isArray(d) ? d : d?.content ?? [])).catch(() => {});
      }, 300);
    };
    carregarDados();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    console.log("Payload para o Spring Boot:", {
      ...formData,
      idLoja: Number(formData.idLoja)
    });
    alert("Área de atuação salva com sucesso!");
  };

  return (
    <Layout title="Agendly">
      <CardCrud>
        <div className="crud-header">
          <h2 className="crud-titulo-pagina">Cadastrar Área de Atuação</h2>
          <p className="crud-subtitulo-pagina">Crie novos setores ou categorias de serviços e vincule-os a uma unidade.</p>
        </div>

        <form className="form-container" onSubmit={handleSalvar}>
          <div className="form-linha">
            <div className="campo-wrapper" style={{ flex: 1.5 }}>
              <label>Nome da Área / Setor</label>
              <input 
                type="text" 
                name="nome"
                placeholder="Ex: Cortes e Barbearia, Estética, Manicure" 
                value={formData.nome}
                onChange={handleChange}
                required 
              />
            </div>
            
            <div className="campo-wrapper" style={{ flex: 1 }}>
              <label>Loja / Unidade</label>
              <select 
                name="idLoja" 
                value={formData.idLoja} 
                onChange={handleChange}
                required
              >
                <option value="">Selecione uma loja...</option>
                {lojas.map(loja => (
                  <option key={loja.id} value={loja.id}>{loja.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper">
              <label>Descrição das Atividades (Opcional)</label>
              <textarea 
                name="descricao"
                className="textarea-descricao-estilo"
                placeholder="Descreva quais tipos de serviços pertencem a este setor..." 
                value={formData.descricao}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <SaveButton label="SALVAR ÁREA" />
          </div>
        </form>
      </CardCrud>
    </Layout>
  );
}