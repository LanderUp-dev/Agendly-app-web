// @requisito RE-01 RO-16
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Check, Circle, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/authService";
import {
  idadeValida,
  somenteDigitos,
  validarCPF,
  validarCelular,
  validarEmail,
} from "@/lib/validators";
import type { UsuarioCadastroPayload } from "@/types/auth";
import { Button, FormField, Logo } from "@/components/ds";
import { useHidratado } from "@/hooks/useHidratado";
import "../Login/LoginView.css";
import "./RegisterView.css";

type Campo =
  | "nome"
  | "sobrenome"
  | "email"
  | "celular"
  | "cpf"
  | "dtaNascimento"
  | "senha"
  | "confirmarSenha"
  | "termos";

const RegisterView = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [aceitouPrivacidade, setAceitouPrivacidade] = useState(false);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const hidratado = useHidratado();

  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    email: "",
    celular: "",
    dtaNascimento: "",
    cpf: "",
    senha: "",
    confirmarSenha: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === "nome" || name === "sobrenome") {
      value = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
    } else if (name === "celular") {
      value = value.replace(/\D/g, "");
      if (value.length <= 11) {
        value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
      }
    } else if (name === "cpf") {
      value = value.replace(/\D/g, "");
      if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      }
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpa o erro do campo assim que a pessoa corrige
    if (erros[name as Campo]) setErros((prev) => ({ ...prev, [name]: undefined }));
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

  /** Mostra o erro junto ao campo, em toast e leva o foco até ele. */
  const falhar = (campo: Campo, mensagem: string) => {
    setErros({ [campo]: mensagem });
    toast.warning(mensagem);
    const alvo = campo === "termos" ? "campo-termos" : `campo-${campo}`;
    requestAnimationFrame(() => document.getElementById(alvo)?.focus());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const payload: UsuarioCadastroPayload = {
      nome: formData.nome.trim(),
      sobrenome: formData.sobrenome.trim(),
      email: formData.email.trim(),
      celular: somenteDigitos(formData.celular),
      cpf: somenteDigitos(formData.cpf),
      dtaNascimento: formData.dtaNascimento,
      senha: formData.senha,
    };

    if (!payload.nome) return falhar("nome", "Informe nome e sobrenome.");
    if (!payload.sobrenome) return falhar("sobrenome", "Informe nome e sobrenome.");
    if (!validarEmail(payload.email)) return falhar("email", "Informe um e-mail válido.");
    if (payload.celular.length !== 11) {
      return falhar("celular", "O celular deve conter 11 dígitos (DDD + número).");
    }
    if (!validarCelular(payload.celular))
      return falhar("celular", "Informe um celular válido com DDD.");
    if (!validarCPF(payload.cpf)) return falhar("cpf", "CPF inválido.");
    if (!idadeValida(payload.dtaNascimento)) {
      return falhar("dtaNascimento", "Você precisa ter entre 18 e 99 anos para criar uma conta.");
    }
    // Letras e números obrigatórios; 72 é o limite de bytes do BCrypt no backend.
    const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
    if (!senhaRegex.test(formData.senha)) {
      return falhar(
        "senha",
        "A senha deve ter no mínimo 8 caracteres, misturando letras e números.",
      );
    }
    if (formData.senha !== formData.confirmarSenha)
      return falhar("confirmarSenha", "As senhas não coincidem!");
    if (!aceitouTermos || !aceitouPrivacidade) {
      return falhar(
        "termos",
        "Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar.",
      );
    }

    setErros({});
    setLoading(true);
    try {
      await authService.cadastrar(payload);
      toast.success("Conta criada com sucesso! Faça login para continuar.");
      navigate({ to: "/login" });
    } catch {
      // A mensagem do backend (texto puro) já aparece em toast pelo interceptor.
    } finally {
      setLoading(false);
    }
  };

  const termosAceitos = aceitouTermos && aceitouPrivacidade;

  return (
    <div className="login-pagina register-pagina">
      <main className="login-card register-card">
        <Link to="/login" aria-label="Agendly — voltar para o login" className="register-logo">
          <Logo variante="horizontal" titulo="" />
        </Link>
        <h1 className="login-titulo">Criar conta</h1>
        <p className="login-subtitulo">Seus dados são tratados conforme a LGPD.</p>

        <form
          className="register-form"
          onSubmit={handleSubmit}
          noValidate
          data-cy="cadastro-form"
          data-hidratado={hidratado}
        >
          <fieldset className="register-secao">
            <legend className="register-secao-titulo">Dados pessoais</legend>
            <div className="form-grade">
              <FormField id="campo-nome" label="Nome" obrigatorio colunas={6} erro={erros.nome}>
                <input
                  type="text"
                  name="nome"
                  autoComplete="given-name"
                  value={formData.nome}
                  onChange={handleChange}
                  data-cy="cadastro-nome"
                />
              </FormField>
              <FormField
                id="campo-sobrenome"
                label="Sobrenome"
                obrigatorio
                colunas={6}
                erro={erros.sobrenome}
              >
                <input
                  type="text"
                  name="sobrenome"
                  autoComplete="family-name"
                  value={formData.sobrenome}
                  onChange={handleChange}
                  data-cy="cadastro-sobrenome"
                />
              </FormField>
              <FormField
                id="campo-dtaNascimento"
                label="Data de nascimento"
                obrigatorio
                colunas={6}
                erro={erros.dtaNascimento}
              >
                <input
                  type="date"
                  name="dtaNascimento"
                  autoComplete="bday"
                  value={formData.dtaNascimento}
                  onChange={handleChange}
                  data-cy="cadastro-nascimento"
                />
              </FormField>
              <FormField id="campo-cpf" label="CPF" obrigatorio colunas={6} erro={erros.cpf}>
                <input
                  type="text"
                  name="cpf"
                  inputMode="numeric"
                  maxLength={14}
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleChange}
                  data-cy="cadastro-cpf"
                />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="register-secao">
            <legend className="register-secao-titulo">Contato</legend>
            <div className="form-grade">
              <FormField
                id="campo-email"
                label="E-mail"
                obrigatorio
                erro={erros.email}
                ajuda="Você vai usar este e-mail para entrar."
              >
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  data-cy="cadastro-email"
                />
              </FormField>
              <FormField id="campo-celular" label="Celular" obrigatorio erro={erros.celular}>
                <input
                  type="tel"
                  name="celular"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  maxLength={15}
                  placeholder="(00) 00000-0000"
                  value={formData.celular}
                  onChange={handleChange}
                  data-cy="cadastro-celular"
                />
              </FormField>
            </div>
          </fieldset>

          <fieldset className="register-secao">
            <legend className="register-secao-titulo">Acesso</legend>
            <div className="form-grade">
              <FormField
                id="campo-senha"
                label="Senha"
                obrigatorio
                erro={erros.senha}
                ajuda={undefined}
              >
                <SenhaInput
                  name="senha"
                  value={formData.senha}
                  onChange={handleChange}
                  visivel={mostrarSenha}
                  onAlternar={() => setMostrarSenha((v) => !v)}
                  descricaoExtra="requisitos-senha"
                  dataCy="cadastro-senha"
                />
              </FormField>
              <ul
                className="register-checklist"
                id="requisitos-senha"
                aria-label="Requisitos da senha"
                aria-live="polite"
              >
                <Requisito ok={requisitosSenha.tamanho}>8 ou mais caracteres</Requisito>
                <Requisito ok={requisitosSenha.letra}>Uma letra</Requisito>
                <Requisito ok={requisitosSenha.numero}>Um número</Requisito>
              </ul>
              <FormField
                id="campo-confirmarSenha"
                label="Confirmar senha"
                obrigatorio
                erro={
                  erros.confirmarSenha ??
                  (senhasCoincidem ? undefined : "As senhas ainda não coincidem.")
                }
              >
                <SenhaInput
                  name="confirmarSenha"
                  value={formData.confirmarSenha}
                  onChange={handleChange}
                  visivel={mostrarConfirmarSenha}
                  onAlternar={() => setMostrarConfirmarSenha((v) => !v)}
                  dataCy="cadastro-confirmar-senha"
                />
              </FormField>
            </div>
          </fieldset>

          <div className="register-termos" id="campo-termos" tabIndex={-1}>
            <span id="aviso-nova-aba" className="sr-only">
              (abre em nova aba)
            </span>
            <label className="register-checkbox-label">
              <input
                type="checkbox"
                checked={aceitouTermos}
                onChange={(e) => setAceitouTermos(e.target.checked)}
                data-cy="cadastro-termos"
              />
              <span>
                Li e aceito os{" "}
                <Link
                  to="/termos-de-uso"
                  target="_blank"
                  className="link"
                  aria-describedby="aviso-nova-aba"
                >
                  Termos de Uso
                </Link>
              </span>
            </label>
            <label className="register-checkbox-label">
              <input
                type="checkbox"
                checked={aceitouPrivacidade}
                onChange={(e) => setAceitouPrivacidade(e.target.checked)}
                data-cy="cadastro-privacidade"
              />
              <span>
                Li e aceito a{" "}
                <Link
                  to="/politicas-de-privacidade"
                  target="_blank"
                  className="link"
                  aria-describedby="aviso-nova-aba"
                >
                  Política de Privacidade
                </Link>
              </span>
            </label>
            {erros.termos && (
              <span className="campo-erro" role="alert">
                {erros.termos}
              </span>
            )}
          </div>

          {!termosAceitos && (
            <p className="campo-ajuda register-aviso-termos">
              Aceite os Termos de Uso e a Política de Privacidade para finalizar.
            </p>
          )}

          <Button
            type="submit"
            bloco
            carregando={loading}
            textoCarregando="Criando conta..."
            disabled={!termosAceitos || !hidratado}
            data-cy="cadastro-enviar"
          >
            Criar conta
          </Button>
        </form>

        <p className="login-rodape">
          Já tem conta?{" "}
          <Link to="/login" className="link">
            Entrar
          </Link>
        </p>
      </main>
    </div>
  );
};

function Requisito({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={ok ? "ok" : ""}>
      {ok ? (
        <Check size={14} strokeWidth={2} aria-hidden="true" />
      ) : (
        <Circle size={12} strokeWidth={2} aria-hidden="true" />
      )}
      {children}
      <span className="sr-only">{ok ? " (atendido)" : " (pendente)"}</span>
    </li>
  );
}

interface SenhaInputProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  visivel: boolean;
  onAlternar: () => void;
  descricaoExtra?: string;
  dataCy: string;
  // Recebidos do FormField via cloneElement
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  required?: boolean;
}

function SenhaInput({
  name,
  value,
  onChange,
  visivel,
  onAlternar,
  descricaoExtra,
  dataCy,
  "aria-describedby": describedBy,
  ...resto
}: SenhaInputProps) {
  const descritores = [describedBy, descricaoExtra].filter(Boolean).join(" ") || undefined;
  return (
    <div className="register-input-senha">
      <input
        {...resto}
        type={visivel ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={72}
        autoComplete="new-password"
        aria-describedby={descritores}
        data-cy={dataCy}
      />
      <button
        type="button"
        className="register-btn-olho"
        onClick={onAlternar}
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
      >
        {visivel ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
      </button>
    </div>
  );
}

export default RegisterView;
