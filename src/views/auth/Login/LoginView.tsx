import React, { useState } from 'react';
import { GoogleLogin, GoogleOAuthProvider, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { authService } from '@/services/endpoints';
import { salvarSessao } from '@/lib/auth';
import './LoginView.css';
import imagemLogin from '@/assets/login.jpg';
import logoAgendly from '@/assets/logoNavbar.png';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

interface BotaoGoogleProps {
  theme: string;
  onErro: (msg: string) => void;
}

function BotaoGoogle({ theme, onErro }: BotaoGoogleProps) {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      onErro('O Google não retornou um credential válido.');
      return;
    }
    setCarregando(true);
    onErro('');
    try {
      const dados = await authService.loginGoogle(idToken);
      salvarSessao(dados);
      toast.success('Conectado com Google!');
      navigate({ to: '/agenda' });
    } catch (err: any) {
      onErro(err?.response?.data || 'Não foi possível entrar com Google.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onErro('Falha ao autenticar com Google.')}
        theme={theme === 'light' ? 'outline' : 'filled_black'}
        size="large"
        width={320}
        locale="pt-BR"
        text="continue_with"
      />
      {carregando && <p className="subtitulo" style={{ marginLeft: 12 }}>Conectando...</p>}
    </div>
  );
}

interface FormEmailSenhaProps {
  onErro: (msg: string) => void;
}

function FormEmailSenha({ onErro }: FormEmailSenhaProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !senha) {
      onErro('Informe email e senha.');
      return;
    }
    setCarregando(true);
    onErro('');
    try {
      const dados = await authService.loginEmailSenha(email, senha);
      salvarSessao(dados);
      toast.success('Login efetuado!');
      navigate({ to: '/agenda' });
    } catch (err: any) {
      onErro(err?.response?.data?.message || err?.response?.data || 'Falha no login.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
        style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid', color: 'var(--texto-secundario)', borderColor: 'var(--texto-secundario)' }}
      />
      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete="current-password"
        required
        style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid', color: 'var(--texto-secundario)', borderColor: 'var(--texto-secundario)' }}
      />
      <button
        type="submit"
        disabled={carregando}
        style={{
          padding: '10px 12px',
          borderRadius: 6,
          border: 'none',
          background: '#16a34a',
          color: '#fff',
          cursor: carregando ? 'not-allowed' : 'pointer',
          fontWeight: 600,
        }}
      >
        {carregando ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

export default function LoginView() {
  const { theme } = useTheme();
  const [errorMessage, setErrorMessage] = useState('');

  const classeTema = theme === 'light' ? 'tema-claro' : 'tema-escuro';


  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className={`login-page-container ${classeTema}`} suppressHydrationWarning>
        <div className="login-left-side">
          <img src={imagemLogin} alt="Bem-vindo de volta!" className="login-bg-image" />
          <img src={logoAgendly} alt="Agendly" className="login-left-logo" />
          <div className="login-left-overlay">
            <h3>Sua agenda. Sua rotina.<br />Tudo em um só lugar.</h3>
            <p>Gerencie clientes, equipes e horários com a fluidez que o seu negócio merece.</p>
          </div>
        </div>

        <div className="login-right-side">
          <div className="login-form-wrapper">
            <h2>Bem-vindo</h2>
            <p className="subtitulo">Entre com email</p>

            {errorMessage && <div className="error-alert">{errorMessage}</div>}

            <FormEmailSenha onErro={setErrorMessage} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0', color: '#888' }}>
              <div style={{ flex: 1, height: 1, background: '#ccc' }} />
              <span style={{ fontSize: 12 }}>ou</span>
              <div style={{ flex: 1, height: 1, background: '#ccc' }} />
            </div>

            <BotaoGoogle theme={theme} onErro={setErrorMessage} />

            <p className="signup-redirect" style={{ marginTop: 24 }}>
              Não tem conta? <a href="/register">Cadastre-se</a>
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}