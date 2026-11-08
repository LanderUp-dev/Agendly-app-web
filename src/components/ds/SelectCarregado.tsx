import React, { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { FormField } from "./FormField";
import type { ErroCarregamento } from "@/hooks/useCarregar";
import { buscaDeRetorno, lerRetorno } from "@/lib/fluxoCadastro";

interface SelectCarregadoProps<T> {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  itens: T[];
  carregando: boolean;
  erroCarregamento: ErroCarregamento | null;
  onTentarNovamente: () => void;
  valorItem: (item: T) => string | number;
  rotuloItem: (item: T) => string;
  /** Ex.: "lojas" — usado em "Carregando lojas..." e "Nenhuma loja cadastrada". */
  nomePlural: string;
  vazioTexto: string;
  /** Rota para cadastrar quando a lista está vazia. */
  cadastrarEm?: string;
  obrigatorio?: boolean;
  /** Seleciona sozinho quando a lista tem um único item (padrão: campos obrigatórios). */
  selecionarUnico?: boolean;
  erro?: string | null;
  colunas?: 12 | 8 | 6 | 4 | 3 | 2;
  "data-cy"?: string;
}

/**
 * Select que depende de uma lista da API: desabilitado com spinner enquanto
 * carrega, mensagem clara quando vazio e "Tentar novamente" quando falha.
 */
export function SelectCarregado<T>({
  id,
  name,
  label,
  value,
  onChange,
  itens,
  carregando,
  erroCarregamento,
  onTentarNovamente,
  valorItem,
  rotuloItem,
  nomePlural,
  vazioTexto,
  cadastrarEm,
  obrigatorio,
  selecionarUnico = obrigatorio,
  erro,
  colunas,
  ...resto
}: SelectCarregadoProps<T>) {
  const vazio = !carregando && !erroCarregamento && itens.length === 0;

  // Pré-seleção, uma vez por montagem, quando a lista chega:
  // 1. o item recém-criado via "Cadastrar agora" (?campo=<name>&novo=<id>);
  // 2. o único item da lista, num campo obrigatório.
  const preSelecionou = useRef(false);
  useEffect(() => {
    if (preSelecionou.current || carregando || erroCarregamento || value !== "") return;
    const escolher = (v: string) => {
      preSelecionou.current = true;
      onChange({ target: { name, value: v } } as unknown as React.ChangeEvent<HTMLSelectElement>);
    };
    const retorno = lerRetorno();
    if (
      retorno.campo === name &&
      retorno.novo &&
      itens.some((i) => String(valorItem(i)) === retorno.novo)
    ) {
      escolher(retorno.novo);
    } else if (selecionarUnico && itens.length === 1) {
      escolher(String(valorItem(itens[0])));
    }
  }, [itens, carregando, erroCarregamento, value, name, onChange, valorItem, selecionarUnico]);

  let ajuda: React.ReactNode;
  if (erroCarregamento) {
    ajuda = (
      <span className="campo-erro">
        Não foi possível carregar as {nomePlural}.{" "}
        <button
          type="button"
          className="link-botao"
          onClick={onTentarNovamente}
          data-cy={`${name}-tentar`}
        >
          Tentar novamente
        </button>
      </span>
    );
  } else if (vazio) {
    ajuda = (
      <>
        {vazioTexto}
        {cadastrarEm && (
          <>
            {" "}
            <Link to={cadastrarEm} search={buscaDeRetorno(name) as never} className="link">
              Cadastrar agora
            </Link>
          </>
        )}
      </>
    );
  }

  let placeholder = "Selecione...";
  if (carregando) placeholder = `Carregando ${nomePlural}...`;
  else if (erroCarregamento) placeholder = "Lista indisponível";
  else if (vazio) placeholder = vazioTexto;

  return (
    <FormField
      id={id}
      label={label}
      obrigatorio={obrigatorio}
      erro={erro}
      ajuda={ajuda}
      carregando={carregando}
      colunas={colunas}
    >
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={carregando || !!erroCarregamento || vazio}
        {...resto}
      >
        <option value="">{placeholder}</option>
        {itens.map((item) => (
          <option key={valorItem(item)} value={valorItem(item)}>
            {rotuloItem(item)}
          </option>
        ))}
      </select>
    </FormField>
  );
}

export default SelectCarregado;
