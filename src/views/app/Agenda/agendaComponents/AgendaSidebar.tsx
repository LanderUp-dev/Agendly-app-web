// @requisito RO-30 RU-02
import React from "react";
import MiniCalendario from "../calendario/MiniCalendario";
import { estiloDoTom, tomDoServico } from "./coresAgenda";
import "./AgendaSidebar.css";

/**
 * Lateral da agenda: mini calendário, filtro de profissionais e legenda das
 * cores (por serviço). A navegação entre cadastros fica na navbar.
 */
interface AgendaSidebarProps {
  id: string;
  aberta: boolean;
  dataSelecionada: Date;
  setDataSelecionada: (data: Date) => void;
  profissionais?: string[];
  profissionaisSelecionados?: string[];
  toggleProfissional?: (nome: string) => void;
  setTodosProfissionais?: (marcar: boolean) => void;
  servicosDoDia?: string[];
}

const AgendaSidebar = ({
  id,
  aberta,
  dataSelecionada,
  setDataSelecionada,
  profissionais = [],
  profissionaisSelecionados = [],
  toggleProfissional = () => {},
  setTodosProfissionais = () => {},
  servicosDoDia = [],
}: AgendaSidebarProps) => {
  const todosMarcados =
    profissionais.length > 0 && profissionaisSelecionados.length === profissionais.length;

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

      <section className="agenda-lateral__secao" aria-labelledby="titulo-profissionais">
        <h2 id="titulo-profissionais" className="agenda-lateral__titulo">
          Profissionais
        </h2>
        {profissionais.length === 0 ? (
          <p className="agenda-lateral__vazio">Nenhum profissional cadastrado.</p>
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
                />
                {p}
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
