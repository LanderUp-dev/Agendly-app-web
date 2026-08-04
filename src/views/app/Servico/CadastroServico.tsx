// @ts-nocheck
// caminho: src/views/app/Servico/CadastroServico.jsx
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { areasAtuacaoService, lojasService } from '@/services/endpoints';
import { CardCrud } from '@/components/cards/CardCrud';
import { SaveButton } from '@/components/buttons/save/SaveButton';

export default function CadastroServico() {
  const [formData, setFormData] = useState({
    nome: '', preco: '', comissaoLoja: '', idLoja: '', idArea: '', descricao: ''
  });
  const [lojas, setLojas] = useState([]);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    lojasService.listar().then((d) => setLojas(Array.isArray(d) ? d : d?.content ?? [])).catch(() => {});
    areasAtuacaoService.listar().then((d) => setAreas(Array.isArray(d) ? d : d?.content ?? [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // 1. Nome: Capitaliza a primeira letra de cada palavra
    if (name === 'nome') {
      value = value.replace(/\b\w/g, (char) => char.toUpperCase());
    }
    // 2. Preço: Apenas números e ponto (positivo)
    else if (name === 'preco') {
      value = value.replace(/[^0-9.]/g, '');
    }
    // 3. Comissão: Apenas números (0 a 100)
    else if (name === 'comissaoLoja') {
      value = value.replace(/[^0-9]/g, '');
      if (Number(value) > 100) value = '100';
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      preco: parseFloat(formData.preco) || 0,
      comissaoLoja: parseFloat(formData.comissaoLoja) || 0,
      idLoja: Number(formData.idLoja),
      idArea: Number(formData.idArea)
    };
    console.log("Enviando ServicoDTO:", payload);
    alert("Serviço salvo com sucesso!");
  };

  return (
    <Layout title="Agendly">
      <style>{`
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus,
        select:-webkit-autofill, textarea:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px #000000 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <CardCrud>
        <div className="crud-header">
          <h2 className="crud-titulo-pagina">Cadastrar Novo Serviço</h2>
          <p className="crud-subtitulo-pagina">Defina valores, comissões e categorize o serviço.</p>
        </div>

        <form className="form-container" onSubmit={handleSalvar}>
          <div className="form-linha">
            <div className="campo-wrapper" style={{ flex: 2 }}>
              <label>Nome do Serviço</label>
              <input type="text" name="nome" placeholder="Ex: Corte Padrão" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper">
              <label>Preço (R$)</label>
              <input type="text" name="preco" placeholder="0.00" value={formData.preco} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper">
              <label>Comissão da Loja (%)</label>
              <input type="text" name="comissaoLoja" placeholder="30" value={formData.comissaoLoja} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper">
              <label>Loja / Unidade</label>
              <select name="idLoja" value={formData.idLoja} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome}</option>)}
              </select>
            </div>
            <div className="campo-wrapper">
              <label>Área de Atuação</label>
              <select name="idArea" value={formData.idArea} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {areas.map(area => <option key={area.id} value={area.id}>{area.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper">
              <label>Descrição</label>
              <textarea name="descricao" rows="3" value={formData.descricao} onChange={handleChange} />
            </div>
          </div>

          <SaveButton label="SALVAR SERVIÇO" />
        </form>
      </CardCrud>
    </Layout>
  );
}