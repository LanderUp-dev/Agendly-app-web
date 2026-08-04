// @ts-nocheck
// caminho: src/views/app/Loja/CadastroLoja.jsx
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import { SaveButton } from '@/components/buttons/save/SaveButton';

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

export default function CadastroLoja() {
  const [formData, setFormData] = useState({
    nome: '', cnpj: '', email: '', celular: '', cep: '', 
    logradouro: '', numero: '', bairro: '', cidade: '', estado: ''
  });

  const handleChange = (e) => {
    let { name, value } = e.target;

    // 1. Campos de texto com capitalização (permite letras e espaços)
    if (['logradouro', 'bairro', 'cidade'].includes(name)) {
      value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
      value = value.replace(/\b\w/g, (char) => char.toUpperCase());
    } 
    // 2. Máscaras numéricas (permite apenas números)
    else if (name === 'cnpj') {
      value = value.replace(/\D/g, '').replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    } 
    else if (name === 'cep') {
      value = value.replace(/\D/g, '').replace(/^(\d{5})(\d{3})/, '$1-$2');
    } 
    else if (name === 'celular') {
      value = value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
      }
    } 
    else if (name === 'numero') {
      value = value.replace(/\D/g, '');
    }

    setFormData((prev) => ({ 
      ...prev, 
      [name]: value.substring(0, e.target.maxLength > 0 ? e.target.maxLength : 100) 
    }));
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      cnpj: formData.cnpj.replace(/\D/g, ''),
      cep: formData.cep.replace(/\D/g, ''),
      celular: formData.celular.replace(/\D/g, '')
    };
    console.log("Enviando LojaDTO:", payload);
    alert("Loja cadastrada com sucesso!");
  };

  return (
    <Layout title="Agendly">
      <style>{`
        input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus,
        select:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px #000000 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <CardCrud>
        <div className="crud-header">
          <h2 className="crud-titulo-pagina">Cadastrar Nova Loja</h2>
          <p className="crud-subtitulo-pagina">Preencha os dados cadastrais e de localização da empresa.</p>
        </div>

        <form className="form-container" onSubmit={handleSalvar}>
          <div className="form-linha">
            <div className="campo-wrapper" style={{ flex: 2 }}>
              <label>Nome da Loja</label>
              <input type="text" name="nome" placeholder="Ex: Filial Juiz de Fora" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper" style={{ flex: 1 }}>
              <label>CNPJ</label>
              <input type="text" name="cnpj" placeholder="00.000.000/0001-00" value={formData.cnpj} onChange={handleChange} maxLength={18} required />
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper">
              <label>E-mail</label>
              <input type="email" name="email" placeholder="contato@empresa.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper">
              <label>Celular / Telefone</label>
              <input type="tel" name="celular" placeholder="(XX) XXXXX-XXXX" value={formData.celular} onChange={handleChange} maxLength={15} required />
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper" style={{ flex: 1 }}>
              <label>CEP</label>
              <input type="text" name="cep" placeholder="36000-000" value={formData.cep} onChange={handleChange} maxLength={9} required />
            </div>
            <div className="campo-wrapper" style={{ flex: 2 }}>
              <label>Logradouro</label>
              <input type="text" name="logradouro" placeholder="Ex: Avenida Rio Branco" value={formData.logradouro} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper" style={{ flex: 0.5 }}>
              <label>Número</label>
              <input type="text" name="numero" placeholder="123" value={formData.numero} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper">
              <label>Bairro</label>
              <input type="text" name="bairro" placeholder="Ex: Centro" value={formData.bairro} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper">
              <label>Cidade</label>
              <input type="text" name="cidade" placeholder="Ex: Juiz de Fora" value={formData.cidade} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper" style={{ flex: 0.5 }}>
              <label>Estado (UF)</label>
              <select name="estado" value={formData.estado} onChange={handleChange} required>
                <option value="">UF</option>
                {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <SaveButton label="SALVAR LOJA" />
          </div>
        </form>
      </CardCrud>
    </Layout>
  );
}