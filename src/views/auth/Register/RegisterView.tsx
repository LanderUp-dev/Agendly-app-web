import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import api from '@/config/axios';
import { Layout } from '@/components/layout/Layout';
import { CardCrud } from '@/components/cards/CardCrud';
import { SaveButton } from '@/components/buttons/save/SaveButton';
import './RegisterView.css';

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
    {visible ? (
      <>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a20.4 20.4 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <path d="M1 1l22 22" />
      </>
    )}
  </svg>
);

const RegisterView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false);

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

  // Feedback visual em tempo real — não substitui a validação no submit
  const requisitosSenha = useMemo(() => {
    const senha = formData.senha;
    return {
      tamanho: senha.length >= 8,
      letra: /[A-Za-z]/.test(senha),
      numero: /\d/.test(senha),
    };
  }, [formData.senha]);

  const senhasCoincidem =
    formData.confirmarSenha.length === 0 || formData.senha === formData.confirmarSenha;

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

    if (!aceitouTermos || !aceitouPrivacidade) {
      toast.warning('Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.');
      return;
    }

    const { confirmarSenha, ...payload } = dadosLimpos;

    setLoading(true);
    try {
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
          <p className="register-subtitulo">
            Leva menos de 2 minutos. Seus dados ficam protegidos conforme a LGPD.
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          {/* SEÇÃO 1 — DADOS PESSOAIS */}
          <fieldset className="register-secao">
            <legend className="register-secao-titulo">Dados pessoais</legend>

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

            <div className="row">
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
              <div className="field">
                <label>CPF</label>
                <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} maxLength={14} placeholder="000.000.000-00" required />
              </div>
            </div>
          </fieldset>

          {/* SEÇÃO 2 — CONTATO */}
          <fieldset className="register-secao">
            <legend className="register-secao-titulo">Contato</legend>

            <div className="field">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="seu@email.com" required />
              <span className="register-hint">Você vai usar esse email para entrar na plataforma.</span>
            </div>

            <div className="field">
              <label>Celular</label>
              <input type="text" name="celular" value={formData.celular} onChange={handleChange} maxLength={15} placeholder="(XX) XXXXX-XXXX" required />
            </div>
          </fieldset>

          {/* SEÇÃO 3 — ACESSO */}
          <fieldset className="register-secao">
            <legend className="register-secao-titulo">Acesso</legend>

            <div className="field">
              <label>Senha</label>
              <div className="register-input-senha">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres (letras e números)"
                  required
                />
                <button
                  type="button"
                  className="register-btn-olho"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  <EyeIcon visible={mostrarSenha} />
                </button>
              </div>

              {formData.senha.length > 0 && (
                <ul className="register-checklist">
                  <li className={requisitosSenha.tamanho ? 'ok' : ''}>8+ caracteres</li>
                  <li className={requisitosSenha.letra ? 'ok' : ''}>Uma letra</li>
                  <li className={requisitosSenha.numero ? 'ok' : ''}>Um número</li>
                </ul>
              )}
            </div>

            <div className="field">
              <label>Confirmar Senha</label>
              <div className="register-input-senha">
                <input
                  type={mostrarConfirmarSenha ? 'text' : 'password'}
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  placeholder="Digite a senha novamente"
                  required
                />
                <button
                  type="button"
                  className="register-btn-olho"
                  onClick={() => setMostrarConfirmarSenha((v) => !v)}
                  aria-label={mostrarConfirmarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  <EyeIcon visible={mostrarConfirmarSenha} />
                </button>
              </div>
              {!senhasCoincidem && (
                <span className="register-erro-inline">As senhas ainda não coincidem.</span>
              )}
            </div>
          </fieldset>

          {/* TERMOS */}
          <div className="register-termos">
            <label className="register-checkbox-label">
              <input
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
              />
              Li e aceito os{' '}
              <Link to="/termos-de-uso" target="_blank" className="link-gold">
                Termos de Uso
              </Link>
            </label>

            <label className="register-checkbox-label">
              <input
                type="checkbox"
                checked={aceitouPrivacidade}
                onChange={(e) => setAceitouPrivacidade(e.target.checked)}
              />
              Li e aceito a{' '}
              <Link to="/politica-de-privacidade" target="_blank" className="link-gold">
                Política de Privacidade
              </Link>
            </label>
          </div>

          <div className="form-actions">
            <SaveButton
              label={loading ? 'CADASTRANDO...' : 'FINALIZAR CADASTRO'}
              disabled={loading || !aceitouTermos || !aceitouPrivacidade}
            />
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