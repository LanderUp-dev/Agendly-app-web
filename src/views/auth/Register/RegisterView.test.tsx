// @requisito RE-01 RO-16
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RegisterView from "@/views/auth/Register/RegisterView";
import { authService } from "@/services/authService";
import { toast } from "sonner";

// Mocks das dependências externas
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  Link: ({
    children,
    to,
    className,
  }: {
    children?: React.ReactNode;
    to: string;
    className?: string;
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/services/authService", () => ({
  authService: {
    cadastrar: vi.fn(),
  },
}));

const CPF_VALIDO = "52998224725";

type Campos = {
  nome: string;
  sobrenome: string;
  email: string;
  celular: string;
  cpf: string;
  dtaNascimento: string;
  senha: string;
  confirmarSenha: string;
};

const camposValidos: Campos = {
  nome: "Maria",
  sobrenome: "Silva",
  email: "maria@email.com",
  celular: "11999998888",
  cpf: CPF_VALIDO,
  dtaNascimento: "2000-01-01",
  senha: "Agendly2026",
  confirmarSenha: "Agendly2026",
};

async function preencherFormulario(
  user: ReturnType<typeof userEvent.setup>,
  sobrescrever: Partial<Campos> = {},
  { aceitarTermos = true } = {},
) {
  const c = { ...camposValidos, ...sobrescrever };

  await user.type(screen.getByLabelText(/^Nome/), c.nome);
  await user.type(screen.getByLabelText(/^Sobrenome/), c.sobrenome);
  await user.type(screen.getByLabelText(/^E-mail/), c.email);
  await user.type(screen.getByLabelText(/^Celular/), c.celular);
  await user.type(screen.getByLabelText(/^CPF/), c.cpf);
  await user.type(screen.getByLabelText(/^Senha/), c.senha);
  await user.type(screen.getByLabelText(/^Confirmar senha/), c.confirmarSenha);

  const dateInput = document.querySelector('input[name="dtaNascimento"]') as HTMLInputElement;
  fireEvent.change(dateInput, { target: { name: "dtaNascimento", value: c.dtaNascimento } });

  if (aceitarTermos) {
    for (const checkbox of screen.getAllByRole("checkbox")) {
      await user.click(checkbox);
    }
  }
}

const botaoCadastrar = () => screen.getByRole("button", { name: /criar conta/i });

describe("RegisterView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar todos os campos do formulário e o botão de cadastro", () => {
    render(<RegisterView />);

    expect(screen.getByLabelText(/^Nome/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Sobrenome/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^E-mail/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Celular/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^CPF/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Confirmar senha/)).toBeInTheDocument();
    expect(botaoCadastrar()).toBeInTheDocument();
  });

  it("deve manter o botão desabilitado até aceitar os termos e a política", async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    await preencherFormulario(user, {}, { aceitarTermos: false });
    expect(botaoCadastrar()).toBeDisabled();

    const [termos, privacidade] = screen.getAllByRole("checkbox");
    await user.click(termos);
    expect(botaoCadastrar()).toBeDisabled();
    await user.click(privacidade);
    expect(botaoCadastrar()).toBeEnabled();
  });

  it("deve apontar o link da política para /politicas-de-privacidade", () => {
    render(<RegisterView />);
    expect(screen.getByText("Política de Privacidade").closest("a")).toHaveAttribute(
      "href",
      "/politicas-de-privacidade",
    );
  });

  it("deve exibir aviso se o celular não contiver 11 dígitos", async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    await preencherFormulario(user, { celular: "119999" });
    await user.click(botaoCadastrar());

    expect(toast.warning).toHaveBeenCalledWith("O celular deve conter 11 dígitos (DDD + número).");
    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it("deve exibir aviso se o CPF for inválido", async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    await preencherFormulario(user, { cpf: "12345678901" });
    await user.click(botaoCadastrar());

    expect(toast.warning).toHaveBeenCalledWith("CPF inválido.");
    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it("deve exigir maioridade (mesma regra do backend)", async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    const ano = new Date().getFullYear() - 10;
    await preencherFormulario(user, { dtaNascimento: `${ano}-01-01` });
    await user.click(botaoCadastrar());

    expect(toast.warning).toHaveBeenCalledWith(
      "Você precisa ter entre 18 e 99 anos para criar uma conta.",
    );
    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it("deve exibir aviso se a senha não atender ao regex de segurança", async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    // Senha apenas com letras (sem números)
    await preencherFormulario(user, { senha: "somenteletras", confirmarSenha: "somenteletras" });
    await user.click(botaoCadastrar());

    expect(toast.warning).toHaveBeenCalledWith(
      "A senha deve ter no mínimo 8 caracteres, misturando letras e números.",
    );
    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it("deve exibir aviso se as senhas não coincidirem", async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    await preencherFormulario(user, { confirmarSenha: "SenhaDiferente1" });
    await user.click(botaoCadastrar());

    expect(toast.warning).toHaveBeenCalledWith("As senhas não coincidem!");
    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it("deve submeter o formulário com dados limpos (dtaNascimento) e redirecionar para /login", async () => {
    const user = userEvent.setup();
    vi.mocked(authService.cadastrar).mockResolvedValueOnce({
      id: 1,
      nome: "Maria",
      sobrenome: "Silva",
      email: "maria@email.com",
      celular: "11999998888",
      cpf: CPF_VALIDO,
      dtaNascimento: "2000-01-01",
    });

    render(<RegisterView />);

    await preencherFormulario(user);
    await user.click(botaoCadastrar());

    await waitFor(() => {
      expect(authService.cadastrar).toHaveBeenCalledWith({
        nome: "Maria",
        sobrenome: "Silva",
        email: "maria@email.com",
        celular: "11999998888",
        cpf: CPF_VALIDO,
        dtaNascimento: "2000-01-01",
        senha: "Agendly2026",
      });
      expect(toast.success).toHaveBeenCalledWith(
        "Conta criada com sucesso! Faça login para continuar.",
      );
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/login" });
    });
  });
});
