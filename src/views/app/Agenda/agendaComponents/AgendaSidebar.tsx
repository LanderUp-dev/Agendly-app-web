// @requisito RO-30 RU-02 RO-33
import React from "react";
import MiniCalendario from "../calendario/MiniCalendario";
import { estiloDoTom, tomDoServico } from "./coresAgenda";
import "./AgendaSidebar.css";

export interface AreaFiltro {
  id: number;
  nome: string;
}

/**
 * Lateral da agenda: mini calendário, filtro por área de atuação e por profissional,
 * e a legenda das cores (por serviço). A navegação entre cadastros fica na navbar.
 */
interface AgendaSidebarProps {
  id: string;
  aberta: boolean;
  dataSelecionada: Date;
  setDataSelecionada: (data: Date) => void;
  /** Profissionais listados no filtro (os da área escolhida, ou todos). */
  /** Chaves (ids) dos profissionais listados. */
  profissionais?: string[];
  /** Chave → nome mostrado (dois profissionais podem ter o mesmo nome). */
  nomes?: ReadonlyMap<string, string>;
  profissionaisSelecionados?: string[];
  toggleProfissional?: (chave: string) => void;
  /** Marca/desmarca todos os profissionais listados. */
  setTodosProfissionais?: (marcar: boolean) => void;
  servicosDoDia?: string[];
  areas?: AreaFiltro[];
  areaSelecionada?: number | null;
  setAreaSelecionada?: (id: number | null) => void;
}

const AgendaSidebar = ({
  id,
  aberta,
  dataSelecionada,
  setDataSelecionada,
  profissionais = [],
  nomes,
  profissionaisSelecionados = [],
  toggleProfissional = () => {},
  setTodosProfissionais = () => {},
  servicosDoDia = [],
  areas = [],
  areaSelecionada = null,
  setAreaSelecionada = () => {},
}: AgendaSidebarProps) => {
  const todosMarcados =
    profissionais.length > 0 && profissionais.every((p) => profissionaisSelecionados.includes(p));

  return (
    <aside
      id={id}
      className={`agenda-lateral ${aberta ? "agenda-lateral--aberta" : ""}`}
      aria-label="Calendário e filtros"
      data-cy="agenda-lateral"
    >
      <section className="agenda-lateral__secao">
        <MiniCalendario dataSelecionada={dataSelecionada} setDataSelecionada={setDataSelecionada} />
      </section>

      {areas.length > 0 && (
        <section className="agenda-lateral__secao">
          <label htmlFor="filtro-area" className="agenda-lateral__titulo agenda-lateral__rotulo">
            Área de atuação
          </label>
          <select
            id="filtro-area"
            className="campo"
            value={areaSelecionada ?? ""}
            onChange={(e) => setAreaSelecionada(e.target.value ? Number(e.target.value) : null)}
            data-cy="filtro-area"
          >
            <option value="">Todas as áreas</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="agenda-lateral__secao" aria-labelledby="titulo-profissionais">
        <h2 id="titulo-profissionais" className="agenda-lateral__titulo">
          Profissionais
        </h2>
        {profissionais.length === 0 ? (
          <p className="agenda-lateral__vazio" data-cy="filtro-area-vazia">
            {areaSelecionada == null
              ? "Nenhum profissional cadastrado."
              : "Nenhum profissional nesta área."}
          </p>
        ) : (
          <div
            className="agenda-lateral__lista"
            role="group"
            aria-labelledby="titulo-profissionais"
          >
            <label className="agenda-lateral__opcao">
              <input
                type="checkbox"
                checked={todosMarcados}
                onChange={(e) => setTodosProfissionais(e.target.checked)}
                data-cy="filtro-todos"
              />
              Todos
            </label>
            {profissionais.map((p) => (
              <label key={p} className="agenda-lateral__opcao">
                <input
                  type="checkbox"
                  checked={profissionaisSelecionados.includes(p)}
                  onChange={() => toggleProfissional(p)}
                  data-cy="filtro-profissional"
                  data-profissional-id={p}
                />
                {nomes?.get(p) ?? p}
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="agenda-lateral__secao" aria-labelledby="titulo-legenda">
        <h2 id="titulo-legenda" className="agenda-lateral__titulo">
          Legenda
        </h2>
        {servicosDoDia.length === 0 ? (
          <p className="agenda-lateral__vazio">Sem agendamentos neste dia.</p>
        ) : (
          <ul className="agenda-legenda" data-cy="agenda-legenda">
            {servicosDoDia.map((s) => (
              <li key={s}>
                <span
                  className="agenda-legenda__cor"
                  style={estiloDoTom(tomDoServico(s))}
                  aria-hidden="true"
                />
                {s}
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
};

export default AgendaSidebar;
