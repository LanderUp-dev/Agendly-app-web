import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterView from '@/views/auth/Register/RegisterView';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

// Mocks das dependências externas
const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/authService', () => ({
  authService: {
    cadastrar: vi.fn(),
  },
}));

// Mock do componente Layout e SaveButton caso contenham lógica interna
vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/cards/CardCrud', () => ({
  CardCrud: ({ children }: any) => <div>{children}</div>,
}));

describe('RegisterView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar todos os campos do formulário e o botão de cadastro', () => {
    render(<RegisterView />);

    expect(screen.getByPlaceholderText('Nome')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Sobrenome')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(XX) XXXXX-XXXX')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mínimo 8 caracteres (letras e números)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Digite a senha novamente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /finalizar cadastro/i })).toBeInTheDocument();
  });

  it('deve exibir aviso se o celular não contiver 11 dígitos', async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    await user.type(screen.getByPlaceholderText('Nome'), 'Maria');
    await user.type(screen.getByPlaceholderText('Sobrenome'), 'Silva');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'maria@email.com');
    await user.type(screen.getByPlaceholderText('(XX) XXXXX-XXXX'), '119999'); // Incompleto
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '12345678901');
    await user.type(screen.getByPlaceholderText('Mínimo 8 caracteres (letras e números)'), 'Senha1234');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'Senha1234');

    await user.click(screen.getByRole('button', { name: /finalizar cadastro/i }));

    expect(toast.warning).toHaveBeenCalledWith('O celular deve conter 11 dígitos (DDD + número).');
    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it('deve exibir aviso se a senha não atender ao regex de segurança', async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    await user.type(screen.getByPlaceholderText('Nome'), 'Maria');
    await user.type(screen.getByPlaceholderText('Sobrenome'), 'Silva');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'maria@email.com');
    await user.type(screen.getByPlaceholderText('(XX) XXXXX-XXXX'), '11999998888');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '12345678901');
    
    // Senha apenas com letras (sem números)
    await user.type(screen.getByPlaceholderText('Mínimo 8 caracteres (letras e números)'), 'somenteletras');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'somenteletras');

    await user.click(screen.getByRole('button', { name: /finalizar cadastro/i }));

    expect(toast.warning).toHaveBeenCalledWith('A senha deve ter no mínimo 8 caracteres, misturando letras e números.');
    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it('deve exibir aviso se as senhas não coincidirem', async () => {
    const user = userEvent.setup();
    render(<RegisterView />);

    await user.type(screen.getByPlaceholderText('Nome'), 'Maria');
    await user.type(screen.getByPlaceholderText('Sobrenome'), 'Silva');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'maria@email.com');
    await user.type(screen.getByPlaceholderText('(XX) XXXXX-XXXX'), '11999998888');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '12345678901');
    await user.type(screen.getByPlaceholderText('Mínimo 8 caracteres (letras e números)'), 'Senha1234');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'SenhaDiferente1');

    await user.click(screen.getByRole('button', { name: /finalizar cadastro/i }));

    expect(toast.warning).toHaveBeenCalledWith('As senhas não coincidem!');
    expect(authService.cadastrar).not.toHaveBeenCalled();
  });

  it('deve submeter o formulário com dados limpos e redirecionar para /login no sucesso', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.cadastrar).mockResolvedValueOnce({
      id: 1,
      nome: 'Maria',
      sobrenome: 'Silva',
      email: 'maria@email.com',
      celular: '11999998888',
      cpf: '12345678901',
      dataNascimento: '2000-01-01',
    });

    render(<RegisterView />);

    await user.type(screen.getByPlaceholderText('Nome'), 'Maria');
    await user.type(screen.getByPlaceholderText('Sobrenome'), 'Silva');
    await user.type(screen.getByPlaceholderText('seu@email.com'), 'maria@email.com');
    await user.type(screen.getByPlaceholderText('(XX) XXXXX-XXXX'), '11999998888');
    await user.type(screen.getByPlaceholderText('000.000.000-00'), '12345678901');
    await user.type(screen.getByPlaceholderText('Mínimo 8 caracteres (letras e números)'), 'Agendly2026');
    await user.type(screen.getByPlaceholderText('Digite a senha novamente'), 'Agendly2026');

    // Preenchendo o campo de data
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) {
      await user.type(dateInput, '2000-01-01');
    }

    await user.click(screen.getByRole('button', { name: /finalizar cadastro/i }));

    await waitFor(() => {
      expect(authService.cadastrar).toHaveBeenCalledWith({
        nome: 'Maria',
        sobrenome: 'Silva',
        email: 'maria@email.com',
        celular: '11999998888',
        cpf: '12345678901',
        dataNascimento: '2000-01-01',
        senha: 'Agendly2026',
      });
      expect(toast.success).toHaveBeenCalledWith('Conta criada com sucesso! Faça login para continuar.');
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
    });
  });
});