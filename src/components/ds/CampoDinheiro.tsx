import React, { useState } from "react";
import { valorAoSair, valorDigitado, valorParaMostrar } from "@/lib/dinheiro";

type PropsDoInput = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "inputMode"
>;

export interface CampoDinheiroProps extends PropsDoInput {
  /** Valor sem o "R$" ("1.234,56", "12,5" ou ""). Leia com lerValor(). */
  value: string;
  /** Recebe o texto limpo a cada tecla e já completo ("1.234,56") ao sair do campo. */
  onValor: (texto: string) => void;
}

/**
 * Campo de valor em reais: mostra "R$ 1.234,56". Enquanto a pessoa digita, aceita só números e
 * uma vírgula (ou ponto) com até 2 casas; ao sair, completa os centavos e os pontos de milhar.
 * Abre o teclado numérico no celular. Funciona dentro de <FormField> como um <input> comum.
 */
export function CampoDinheiro({ value, onValor, onFocus, onBlur, ...resto }: CampoDinheiroProps) {
  const [editando, setEditando] = useState(false);
  return (
    <input
      placeholder="R$ 0,00"
      autoComplete="off"
      {...resto}
      type="text"
      inputMode="decimal"
      value={valorParaMostrar(value, editando)}
      onChange={(e) => onValor(valorDigitado(e.target.value))}
      onFocus={(e) => {
        setEditando(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setEditando(false);
        onValor(valorAoSair(e.target.value));
        onBlur?.(e);
      }}
    />
  );
}
