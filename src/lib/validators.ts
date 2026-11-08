/** Validações de formulário usadas antes de enviar dados ao backend. */

export const somenteDigitos = (valor: string | null | undefined): string =>
  (valor ?? "").replace(/\D/g, "");

export function validarCPF(valor: string): boolean {
  const cpf = somenteDigitos(valor);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) soma += Number(base[i]) * (pesoInicial - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = digito(cpf.slice(0, 9), 10);
  const d2 = digito(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function validarCNPJ(valor: string): boolean {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const digito = (base: string) => {
    const pesos =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split("").reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = digito(cnpj.slice(0, 12));
  const d2 = digito(cnpj.slice(0, 13));
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

/** Celular brasileiro: DDD + 9 dígitos começando com 9. */
export function validarCelular(valor: string): boolean {
  return /^[1-9]{2}9\d{8}$/.test(somenteDigitos(valor));
}

/** Telefone fixo: DDD + 8 dígitos. */
export function validarTelefoneFixo(valor: string): boolean {
  return /^[1-9]{2}[2-5]\d{7}$/.test(somenteDigitos(valor));
}

export function validarEmail(valor: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

/**
 * Mesma regra do backend (utils/Validator.validarIdade):
 * data não pode ser futura e a idade deve estar entre 18 e 99 anos.
 * Recebe a data no formato do input date (yyyy-MM-dd).
 */
export function idadeValida(dataISO: string, hoje: Date = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataISO ?? "");
  if (!m) return false;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const nascimento = new Date(ano, mes - 1, dia);
  if (nascimento.getMonth() !== mes - 1 || nascimento.getDate() !== dia) return false;
  if (nascimento > hoje) return false;

  let idade = hoje.getFullYear() - ano;
  const aindaNaoFezAniversario =
    hoje.getMonth() < mes - 1 || (hoje.getMonth() === mes - 1 && hoje.getDate() < dia);
  if (aindaNaoFezAniversario) idade--;

  return idade >= 18 && idade < 100;
}
