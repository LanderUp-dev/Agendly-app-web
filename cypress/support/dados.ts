/**
 * Geração de dados de teste: sufixo único por execução e CPF/CNPJ válidos
 * (mesmo algoritmo de src/lib/validators.ts).
 */

export const sufixo = () =>
  `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

const aleatorios = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10));

export function gerarCPF(): string {
  let base = aleatorios(9);
  while (base.every((d) => d === base[0])) base = aleatorios(9);
  const digito = (nums: number[], pesoInicial: number) => {
    const soma = nums.reduce((acc, n, i) => acc + n * (pesoInicial - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  const d1 = digito(base, 10);
  const d2 = digito([...base, d1], 11);
  return [...base, d1, d2].join("");
}

export function gerarCNPJ(): string {
  const base = [...aleatorios(8), 0, 0, 0, 1];
  const digito = (nums: number[]) => {
    const pesos =
      nums.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = nums.reduce((acc, n, i) => acc + n * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digito(base);
  const d2 = digito([...base, d1]);
  return [...base, d1, d2].join("");
}

/** Celular válido (DDD 32 + 9 + 8 dígitos). */
export const gerarCelular = () => `329${aleatorios(8).join("")}`;

/** Data yyyy-MM-dd de alguém com `anos` de idade. */
export function nascimento(anos: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - anos);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Data de hoje no fuso local, yyyy-MM-dd (como o backend espera). */
export function hojeISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Data de hoje dd/MM/yyyy (como a agenda exibe/compara). */
export function hojeBR(): string {
  const [a, m, d] = hojeISO().split("-");
  return `${d}/${m}/${a}`;
}

export const somenteDigitos = (v: string) => v.replace(/\D/g, "");
