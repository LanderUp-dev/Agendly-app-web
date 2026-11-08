// @requisito RO-40
/** Regra de senha (igual ao cadastro e ao backend): 8+ caracteres, com letra e número. */
export function avaliarSenha(senha: string) {
  return {
    tamanho: senha.length >= 8,
    letra: /[A-Za-z]/.test(senha),
    numero: /\d/.test(senha),
  };
}

export function senhaValida(senha: string): boolean {
  const r = avaliarSenha(senha);
  return r.tamanho && r.letra && r.numero;
}
