// @ts-nocheck
// caminho: src/views/app/Cobrancista/CadastroCobrancista.jsx
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { lojasService } from '@/services/endpoints';
import { CardCrud } from '@/components/cards/CardCrud';
import { SaveButton } from '@/components/buttons/save/SaveButton';

export default function CadastroCobrancista() {
  const [formData, setFormData] = useState({
    nome: '', email: '', celular: '', telefone: '', idLoja: '', descricao: ''
  });
  const [lojas, setLojas] = useState([]);

  useEffect(() => {
    lojasService.listar().then((d) => setLojas(Array.isArray(d) ? d : d?.content ?? [])).catch(() => { });
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;


    if (name === 'nome') {
      value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, '').replace(/\b\w/g, (char) => char.toUpperCase());
    }

    else if (name === 'celular') {
      value = value.replace(/\D/g, '');
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
      }
    }

    else if (name === 'telefone') {
      value = value.replace(/\D/g, '');
      if (value.length <= 10) {
        value = value.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
      }
    }

    setFormData(prev => ({ ...prev, [name]: value.substring(0, e.target.maxLength > 0 ? e.target.maxLength : 100) }));
  };

  const handleSalvar = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      idLoja: Number(formData.idLoja),
      celular: formData.celular.replace(/\D/g, ''),
      telefone: formData.telefone.replace(/\D/g, '')
    };
    console.log("CobrancistaDTO:", payload);
    alert("Cobrancista cadastrado!");
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
          <h2 className="crud-titulo-pagina">Cadastrar Cobrancista</h2>
          <p className="crud-subtitulo-pagina">Insira as informações do profissional e associe-o a uma unidade.</p>
        </div>

        <form className="form-container" onSubmit={handleSalvar}>
          <div className="form-linha">
            <div className="campo-wrapper" style={{ flex: 2 }}>
              <label>Nome Completo</label>
              <input type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleChange} required />
            </div>
            <div className="campo-wrapper" style={{ flex: 1 }}>
              <label>E-mail</label>
              <input type="email" name="email" placeholder="cobrancista@email.com" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper">
              <label>Celular</label>
              <input type="tel" name="celular" placeholder="(XX) XXXXX-XXXX" value={formData.celular} onChange={handleChange} maxLength={15} required />
            </div>
            <div className="campo-wrapper">
              <label>Telefone Fixo</label>
              <input type="tel" name="telefone" placeholder="(XX) XXXX-XXXX" value={formData.telefone} onChange={handleChange} maxLength={14} />
            </div>
            <div className="campo-wrapper">
              <label>Loja Vinculada</label>
              <select name="idLoja" value={formData.idLoja} onChange={handleChange} required>
                <option value="">Selecione...</option>
                {lojas.map(loja => <option key={loja.id} value={loja.id}>{loja.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="form-linha">
            <div className="campo-wrapper">
              <label>Descrição / Observações</label>
              <textarea name="descricao" rows="3" value={formData.descricao} onChange={handleChange} />
            </div>
          </div>

          <SaveButton label="SALVAR COBRANCISTA" />
        </form>
      </CardCrud>
    </Layout>
  );
}