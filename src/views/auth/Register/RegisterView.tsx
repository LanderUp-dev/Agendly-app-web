import React, { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import api from '@/config/axios';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import { SaveButton } from '@/components/buttons/save/SaveButton';
import './RegisterView.css';

const RegisterView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    celular: '',
    dataNascimento: '',
    cpf: '',
    senha: '',
    confirmarSenha: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

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

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dadosLimpos = {
      ...formData,
      celular: formData.celular.replace(/\D/g, ''),
      cpf: formData.cpf.replace(/\D/g, '')
    };

    if (dadosLimpos.celular.length !== 11) {
      toast.warning('O celular deve conter 11 dígitos (DDD + número).');
      return;
    }

    const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!senhaRegex.test(formData.senha)) {
      toast.warning('A senha deve ter no mínimo 8 caracteres, misturando letras e números.');
      return;
    }

    if (formData.senha !== formData.confirmarSenha) {
      toast.warning('As senhas não coincidem!');
      return;
    }

    // Remove o campo de confirmação antes de enviar para o payload do back
    const { confirmarSenha, ...payload } = dadosLimpos;

    setLoading(true);
    try {
      // Chamada correta apontando para /api/v1/usuarios
      await api.post('/usuarios', payload);

      toast.success('Conta criada com sucesso! Faça login para continuar.');
      navigate({ to: '/login' });
    } catch {
      // Erros de validação (400, 422, 409) já disparam o toast via interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Agendly" voltarPara="/">
      <CardCrud>
        <div className="register-header">
          <h2>Criar Nova Conta</h2>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="row">
            <div className="field">
              <label>Nome</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleChange} placeholder="Nome" required />
            </div>
            <div className="field">
              <label>Sobrenome</label>
              <input type="text" name="sobrenome" value={formData.sobrenome} onChange={handleChange} placeholder="Sobrenome" required />
            </div>
          </div>

          <div className="field">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" required />
          </div>

          <div className="row">
            <div className="field">
              <label>Celular</label>
              <input type="text" name="celular" value={formData.celular} onChange={handleChange} maxLength={15} placeholder="(XX) XXXXX-XXXX" required />
            </div>
            <div className="field">
              <label>Data de Nascimento</label>
              <input
                type="date"
                name="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>CPF</label>
            <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} maxLength={14} placeholder="000.000.000-00" required />
          </div>

          <div className="field">
            <label>Senha</label>
            <input type="password" name="senha" value={formData.senha} onChange={handleChange} placeholder="Mínimo 8 caracteres (letras e números)" required />
          </div>

          <div className="field">
            <label>Confirmar Senha</label>
            <input type="password" name="confirmarSenha" value={formData.confirmarSenha} onChange={handleChange} placeholder="Digite a senha novamente" required />
          </div>

          <div className="form-actions">
            <SaveButton label={loading ? "CADASTRANDO..." : "FINALIZAR CADASTRO"} disabled={loading} />
          </div>
        </form>

        <p className="footer-text">
          Já possui uma conta? <Link to="/login" className="link-gold">Faça Login</Link>
        </p>
      </CardCrud>
    </Layout>
  );
};

export default RegisterView;