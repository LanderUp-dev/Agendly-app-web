// @ts-nocheck
// caminho: src/views/app/Funcionario/CadastroFuncionario.jsx
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { lojasService } from '@/services/endpoints';
import { CardCrud } from '@/components/cards/CardCrud';
import { SaveButton } from '@/components/buttons/save/SaveButton';

export default function CadastroFuncionario() {
  const [formData, setFormData] = useState({
    nome: '', sobrenome: '', cpf: '', dtaNascimento: '', email: '', celular: '', idLoja: ''
  });
  const [lojas, setLojas] = useState([]);

  useEffect(() => {
    lojasService.listar().then((d) => setLojas(Array.isArray(d) ? d : d?.content ?? [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Filtros de digitação e máscaras
    if (name === 'nome' || name === 'sobrenome') {
      value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '');
    } else if (name === 'celular') {
      value = value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
        value = value.replace(/(\d{5})(\d)/, '$1-$2');
      }
    } else if (name === 'cpf') {
      value = value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    
    // Payload padronizado para o Backend Java (limpeza das máscaras)
    const payload = {
      ...formData,
      idLoja: Number(formData.idLoja),
      cpf: formData.cpf.replace(/\D/g, ''),
      celular: formData.celular.replace(/\D/g, '')
    };

    console.log("Enviando FuncionarioDTO:", payload);
    alert("Funcionário cadastrado com sucesso!");
  };

  return (
    <Layout title="Agendly">
      {/* Estilo para forçar fundo escuro no autofill */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        select:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px #000000 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <CardCrud>
        <div className="crud-header">
          <h2 className="crud-titulo-pagina">Cadastrar Novo Funcionário</h2>
          <p className="crud-subtitulo-pagina">Registre os dados profissionais e aloque-os em uma unidade.</p>
        </div>

        <form className="form-container" onSubmit={handleSalvar}>
          <div className="form-linha">
            <div className="campo-wrapper">
              <label>Nome</label>
              <input type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper">
              <label>Sobrenome</label>
              <input type="text" name="sobrenome" placeholder="Sobrenome" value={formData.sobrenome} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper">
              <label>CPF</label>
              <input type="text" name="cpf" placeholder="000.000.000-00" value={formData.cpf} onChange={handleChange} maxLength={14} required />
            </div>
            <div className="campo-wrapper">
              <label>Data de Nascimento</label>
              <input 
                type="date" 
                name="dtaNascimento" 
                value={formData.dtaNascimento} 
                onChange={handleChange} 
                onClick={(e) => e.target.showPicker?.()} 
                required 
              />
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper" style={{ flex: 1.5 }}>
              <label>E-mail</label>
              <input type="email" name="email" placeholder="funcionario@email.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper">
              <label>Celular</label>
              <input type="tel" name="celular" placeholder="(XX) XXXXX-XXXX" value={formData.celular} onChange={handleChange} maxLength={15} required />
            </div>
            <div className="campo-wrapper">
              <label>Loja de Trabalho</label>
              <select name="idLoja" value={formData.idLoja} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '15px' }}>
            <SaveButton label="CADASTRAR FUNCIONÁRIO" />
          </div>
        </form>
      </CardCrud>
    </Layout>
  );
}