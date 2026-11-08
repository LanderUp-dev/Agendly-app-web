// @requisito RO-34 RO-40 RO-41 RS-08
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { authService } from "@/services/endpoints";
import { estaAutenticado, salvarSessao } from "@/lib/auth";
import { destinoAposLogin } from "@/lib/contexto";
import "./LoginView.css";
import { Button, Logo } from "@/components/ds";
import { useHidratado } from "@/hooks/useHidratado";

interface FormEmailSenhaProps {
  onErro: (msg: string) => void;
  /** id da mensagem de erro exibida, para aria-describedby/aria-invalid. */
  erroId?: string;
}

function FormEmailSenha({ onErro, erroId }: FormEmailSenhaProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const hidratado = useHidratado();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailLimpo = email.trim();
    if (!emailLimpo || !senha) {
      onErro("Informe e-mail e senha.");
      return;
    }
    setCarregando(true);
    onErro("");
    try {
      const dados = await authService.loginEmailSenha(emailLimpo, senha);
      if (!salvarSessao(dados)) {
        onErro("Não foi possível iniciar a sessão. Tente novamente.");
        return;
      }
      toast.success("Login efetuado!");
      // Sem loja → cadastro da loja; uma loja → entra nela; várias → escolher.
      navigate({ to: await destinoAposLogin(dados.equipes) });
    } catch (err) {
      // Mensagens de rede/5xx já aparecem em toast pelo interceptor do axios.
      // Aqui só mostramos texto fixo — nunca o objeto de resposta no JSX.
      const status = isAxiosError(err) ? err.response?.status : undefined;
      if (status === 401) {
        onErro("E-mail ou senha incorretos.");
      } else if (status === 400) {
        onErro("Informe um e-mail válido e a senha.");
      } else if (status === 429) {
        // Texto fixo do backend ("Muitas tentativas... Tente de novo em N minutos.")
        const texto = isAxiosError(err) ? err.response?.data : undefined;
        onErro(
          typeof texto === "string" && texto.startsWith("Muitas tentativas")
            ? texto
            : "Muitas tentativas. Aguarde alguns minutos e tente de novo.",
        );
      } else {
        onErro("Não foi possível entrar agora. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <form
      className="login-form"
      onSubmit={handleSubmit}
      noValidate
      aria-describedby={erroId}
      data-cy="login-form"
      data-hidratado={hidratado}
    >
      <div className="campo-wrapper">
        <label htmlFor="login-email">E-mail</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
          aria-invalid={erroId ? true : undefined}
          required
          data-cy="login-email"
        />
      </div>
      <div className="campo-wrapper">
        <label htmlFor="login-senha">Senha</label>
        <input
          id="login-senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          aria-invalid={erroId ? true : undefined}
          required
          data-cy="login-senha"
        />
      </div>
      <Button
        type="submit"
        bloco
        carregando={carregando}
        textoCarregando="Entrando..."
        disabled={!hidratado}
        data-cy="login-entrar"
      >
        Entrar
      </Button>
      <Link to="/recuperar-senha" className="link login-esqueci" data-cy="link-esqueci-senha">
        Esqueci minha senha
      </Link>
    </form>
  );
}

export default function LoginView() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  // Quem já tem sessão válida não precisa ver a tela de login.
  useEffect(() => {
    if (estaAutenticado()) navigate({ to: "/agenda", replace: true });
  }, [navigate]);

  return (
    <div className="login-pagina">
      <main className="login-card">
        <Logo variante="horizontal" titulo="Agendly" className="login-logo" />
        <h1 className="login-titulo">Entrar</h1>
        <p className="login-subtitulo">Use o e-mail e a senha da sua conta.</p>

        {errorMessage && (
          <div
            id="login-erro"
            className="alerta alerta-erro login-alerta"
            role="alert"
            data-cy="login-erro"
          >
            {errorMessage}
          </div>
        )}

        <FormEmailSenha onErro={setErrorMessage} erroId={errorMessage ? "login-erro" : undefined} />

        <p className="login-rodape">
          Ainda não tem conta?{" "}
          <Link to="/register" className="link" data-cy="link-cadastro">
            Criar conta
          </Link>
        </p>
      </main>
    </div>
  );
}
