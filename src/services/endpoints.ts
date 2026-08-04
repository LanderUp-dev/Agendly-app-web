import api from '@/config/axios';

interface CrudService<T = any> {
  listar: () => Promise<T[]>;
  buscar: (id: string | number) => Promise<T>;
  criar: (payload: any) => Promise<T>;
  atualizar: (id: string | number, payload: any) => Promise<T>;
  remover: (id: string | number) => Promise<any>;
}

const crud = <T = any>(recurso: string): CrudService<T> => ({
  listar: () => api.get<T[]>(`/${recurso}`).then((r) => r.data),
  buscar: (id: string | number) => api.get<T>(`/${recurso}/${id}`).then((r) => r.data),
  criar: (payload: any) => api.post<T>(`/${recurso}`, payload).then((r) => r.data),
  atualizar: (id: string | number, payload: any) =>
    api.put<T>(`/${recurso}/${id}`, payload).then((r) => r.data),
  remover: (id: string | number) => api.delete(`/${recurso}/${id}`).then((r) => r.data),
});

export const clientesService = crud('clientes');
export const lojasService = crud('lojas');
export const servicosService = crud('servicos');
export const equipesService = crud('equipes');
export const funcionariosService = crud('funcionarios');
export const cobrancistasService = crud('cobrancistas');
export const areasAtuacaoService = crud('area-atuacao');
export const areasFuncionarioService = crud('area-funcionario');
export const agendamentosService = crud('agendamentos');

interface AuthResponse {
  token?: string;
  usuario?: {
    id: string;
    email: string;
    nome: string;
  };
}

export const authService = {
  loginGoogle: (idToken: string) => 
    api.post<AuthResponse>('/auth/google', { idToken }).then((r) => r.data),
    
  loginEmailSenha: (email: string, senha: string) =>
    api.post<AuthResponse>('/auth/login', { email, senha }).then((r) => r.data),
};