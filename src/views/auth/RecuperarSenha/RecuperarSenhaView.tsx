// @requisito RO-40 RS-11
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { authService } from "@/services/endpoints";
import { Button, Logo } from "@/components/ds";
import { useHidratado } from "@/hooks/useHidratado";
import { avaliarSenha, senhaValida } from "@/lib/senha";
import "../Login/LoginView.css";

/**
 * "Esqueci a senha" em duas etapas:
 * 1. informa o e-mail -> a API manda um código de 6 dígitos (vale 15 min, 5 tentativas);
 * 2. informa o código e a senha nova.
 * A resposta da etapa 1 é sempre a mesma, exista a conta ou não (não revela quem é cliente).
 */
export default function RecuperarSenhaView() {
  const navigate = useNavigate();
  const hidratado = useHidratado();
  const [etapa, setEtapa] = useState<"email" | "codigo">("email");
  const campoEmail = useRef<HTMLInputElement>(null);
  const campoCodigo = useRef<HTMLInputElement>(null);
  // Foco no primeiro campo de cada etapa (autoFocus não vale em página vinda do servidor).
  useEffect(() => {
    (etapa === "email" ? campoEmail : campoCodigo).current?.focus();
  }, [etapa]);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  const requisitos = avaliarSenha(senha);

  const pedirCodigo = async () => {
    await authService.solicitarRecuperacao(email.trim());
  };

  const enviarEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErro("Informe um e-mail válido.");
      return;
    }
    setErro("");
    setCarregando(true);
    try {
      await pedirCodigo();
      setEtapa("codigo");
    } catch {
      setErro("Não foi possível enviar o código agora. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  const reenviar = async () => {
    setReenviando(true);
    setErro("");
    try {
      await pedirCodigo();
      setCodigo("");
      toast.success("Enviamos um novo código. O anterior deixou de valer.");
    } catch {
      setErro("Não foi possível reenviar o código agora. Tente novamente.");
    } finally {
      setReenviando(false);
    }
  };

  const redefinir = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo.trim())) {
      setErro("O código tem 6 números.");
      return;
    }
    if (!senhaValida(senha)) {
      setErro("A senha deve ter no mínimo 8 caracteres, misturando letras e números.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setErro("");
    setCarregando(true);
    try {
      await authService.redefinirSenha(email.trim(), codigo.trim(), senha);
      toast.success("Senha alterada! Entre com a senha nova.");
      navigate({ to: "/login" });
    } catch (err) {
      const dados = isAxiosError(err) ? err.response?.data : undefined;
      // Mensagens fixas da API (código inválido/expirado, tentativas, senha fraca)
      setErro(
        typeof dados === "string" && dados.length < 200
          ? dados
          : "Não foi possível alterar a senha agora. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-pagina">
      <main className="login-card">
        <Logo variante="horizontal" titulo="Agendly" className="login-logo" />
        <h1 className="login-titulo">Recuperar senha</h1>
        <p className="login-subtitulo" data-cy="recuperar-instrucao" aria-live="polite">
          {etapa === "email"
            ? "Informe o e-mail da sua conta. Vamos enviar um código para criar uma senha nova."
            : `Se ${email.trim()} tiver uma conta, enviamos um código de 6 números. Ele vale por 15 minutos.`}
        </p>

        {erro && (
          <div
            id="recuperar-erro"
            className="alerta alerta-erro login-alerta"
            role="alert"
            data-cy="recuperar-erro"
          >
            {erro}
          </div>
        )}

        {etapa === "email" ? (
          <form
            className="login-form"
            onSubmit={enviarEmail}
            noValidate
            data-cy="recuperar-form-email"
            data-hidratado={hidratado}
          >
            <div className="campo-wrapper">
              <label htmlFor="recuperar-email">E-mail</label>
              <input
                id="recuperar-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                aria-invalid={erro ? true : undefined}
                aria-describedby={erro ? "recuperar-erro" : undefined}
                required
                ref={campoEmail}
                data-cy="recuperar-email"
              />
            </div>
            <Button
              type="submit"
              bloco
              carregando={carregando}
              textoCarregando="Enviando..."
              disabled={!hidratado}
              data-cy="recuperar-enviar"
            >
              Enviar código
            </Button>
          </form>
        ) : (
          <form
            className="login-form"
            onSubmit={redefinir}
            noValidate
            data-cy="recuperar-form-codigo"
          >
            <div className="campo-wrapper">
              <label htmlFor="recuperar-codigo">Código</label>
              <input
                id="recuperar-codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                aria-invalid={erro ? true : undefined}
                aria-describedby={erro ? "recuperar-erro" : undefined}
                required
                ref={campoCodigo}
                data-cy="recuperar-codigo"
              />
            </div>
            <div className="campo-wrapper">
              <label htmlFor="recuperar-senha">Nova senha</label>
              <input
                id="recuperar-senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                aria-describedby="recuperar-requisitos"
                required
                data-cy="recuperar-senha"
              />
              <ul id="recuperar-requisitos" className="recuperar-requisitos">
                <li data-ok={requisitos.tamanho}>Mínimo de 8 caracteres</li>
                <li data-ok={requisitos.letra}>Pelo menos uma letra</li>
                <li data-ok={requisitos.numero}>Pelo menos um número</li>
              </ul>
            </div>
            <div className="campo-wrapper">
              <label htmlFor="recuperar-confirmar">Confirmar nova senha</label>
              <input
                id="recuperar-confirmar"
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
                required
                data-cy="recuperar-confirmar"
              />
            </div>
            <Button
              type="submit"
              bloco
              carregando={carregando}
              textoCarregando="Salvando..."
              data-cy="recuperar-salvar"
            >
              Salvar nova senha
            </Button>
            <div className="recuperar-acoes">
              <button
                type="button"
                className="link"
                onClick={reenviar}
                disabled={reenviando}
                data-cy="recuperar-reenviar"
              >
                {reenviando ? "Reenviando..." : "Reenviar código"}
              </button>
              <button
                type="button"
                className="link"
                onClick={() => {
                  setEtapa("email");
                  setErro("");
                  setCodigo("");
                }}
                data-cy="recuperar-trocar-email"
              >
                Usar outro e-mail
              </button>
            </div>
          </form>
        )}

        <p className="login-rodape">
          Lembrou a senha?{" "}
          <Link to="/login" className="link" data-cy="link-voltar-login">
            Voltar para o login
          </Link>
        </p>
      </main>
    </div>
  );
}
