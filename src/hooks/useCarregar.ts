import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";

/**
 * Carrega dados de uma função que devolve Promise (ex.: `lojasService.listar`)
 * e expõe os estados que a tela precisa para mostrar skeleton, erro e
 * "Tentar novamente". Não muda services nem payloads: só observa a chamada.
 */
export type TipoErroCarregamento = "timeout" | "rede" | "servidor" | "acesso" | "outro";

export interface ErroCarregamento {
  tipo: TipoErroCarregamento;
  mensagem: string;
}

export function classificarErro(erro: unknown): ErroCarregamento {
  if (isAxiosError(erro)) {
    if (erro.code === "ECONNABORTED" || erro.code === "ETIMEDOUT") {
      return {
        tipo: "timeout",
        mensagem: "O servidor demorou mais de 15 segundos para responder.",
      };
    }
    if (!erro.response) {
      return { tipo: "rede", mensagem: "Não foi possível conectar ao servidor." };
    }
    const status = erro.response.status;
    if (status === 401 || status === 403) {
      return { tipo: "acesso", mensagem: "Sua sessão não permite ver estes dados." };
    }
    if (status >= 500) {
      return { tipo: "servidor", mensagem: "O servidor encontrou um erro ao buscar os dados." };
    }
  }
  return { tipo: "outro", mensagem: "Não foi possível carregar os dados." };
}

export function useCarregar<T>(buscar: () => Promise<T>, valorInicial: T) {
  const [dados, setDados] = useState<T>(valorInicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroCarregamento | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setErro(null);
    buscarRef
      .current()
      .then((resultado) => {
        if (ativo) setDados(resultado);
      })
      .catch((e) => {
        if (ativo) setErro(classificarErro(e));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const recarregar = useCallback(() => setTentativa((n) => n + 1), []);

  return { dados, setDados, carregando, erro, recarregar };
}

export default useCarregar;
