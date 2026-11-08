import { useEffect, useState } from "react";

/**
 * true depois que o React hidratou a página.
 * Login e Cadastro de conta são renderizados no servidor (SSR): antes da
 * hidratação, um clique em "Entrar" faria o envio nativo do formulário (sem
 * chamar a API). Os botões de envio ficam desabilitados até aqui.
 */
export function useHidratado(): boolean {
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => setHidratado(true), []);
  return hidratado;
}

export default useHidratado;
