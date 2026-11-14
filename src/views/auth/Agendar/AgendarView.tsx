// @requisito RO-44
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, CircleAlert } from "lucide-react";
import { Button, FormField, Logo } from "@/components/ds";
import {
  agendaPublicaService,
  diasDisponiveis,
  juntarHorarios,
  type HorariosDoProfissional,
  type Marcado,
  type Vitrine,
} from "@/services/agendaOnline";
import { somenteDigitos, validarCelular } from "@/lib/validators";
import { formatarMoeda } from "@/lib/formatadores";
import "../Login/LoginView.css";
import "./AgendarView.css";

type Estado =
  | { fase: "carregando" }
  | { fase: "fechada" }
  | { fase: "erro" }
  | { fase: "pronto"; vitrine: Vitrine };

/** Os horários aparecem em blocos: fica mais fácil achar "depois do almoço" no celular. */
const PERIODOS = [
  { nome: "Manhã", de: "00:00", ate: "12:00" },
  { nome: "Tarde", de: "12:00", ate: "18:00" },
  { nome: "Noite", de: "18:00", ate: "24:00" },
];

const duracaoTexto = (min: number) =>
  min < 60 ? `${min} min` : `${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ""}`;

function mascaraCelular(valor: string): string {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const mensagemDoErro = (e: unknown, padrao: string): string => {
  const r = (e as { response?: { status?: number; data?: unknown } })?.response;
  return typeof r?.data === "string" && (r.status === 400 || r.status === 429) ? r.data : padrao;
};

/**
 * Página pública "Agendar" da loja (sem login), aberta pelo cliente no celular:
 * serviço → profissional → dia → horário livre → nome e celular. Só aparecem horários
 * realmente livres; o servidor confere de novo na hora de gravar.
 */
export default function AgendarView({ slug }: { slug: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  const [idServico, setIdServico] = useState<number | null>(null);
  /** null = qualquer profissional. */
  const [idProfissional, setIdProfissional] = useState<number | null>(null);
  const [dia, setDia] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [horarios, setHorarios] = useState<HorariosDoProfissional[] | null>(null);
  const [erroHorarios, setErroHorarios] = useState(false);
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [erros, setErros] = useState<{ nome?: string; celular?: string }>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [marcado, setMarcado] = useState<Marcado | null>(null);
  const tituloFinal = useRef<HTMLHeadingElement>(null);
  const secaoDados = useRef<HTMLElement>(null);

  useEffect(() => {
    let ativo = true;
    agendaPublicaService
      .vitrine(slug)
      .then((vitrine) => {
        if (!ativo) return;
        setEstado({ fase: "pronto", vitrine });
        // Um serviço só: já vem escolhido.
        if (vitrine.servicos.length === 1) setIdServico(vitrine.servicos[0].id);
      })
      .catch((e) => ativo && setEstado({ fase: e?.response?.status === 404 ? "fechada" : "erro" }));
    return () => {
      ativo = false;
    };
  }, [slug]);

  const vitrine = estado.fase === "pronto" ? estado.vitrine : null;
  const servico = vitrine?.servicos.find((s) => s.id === idServico) ?? null;
  const dias = useMemo(
    () => (vitrine ? diasDisponiveis(vitrine.hoje, vitrine.diasAFrente) : []),
    [vitrine],
  );

  // Horários livres do dia escolhido. Recarrega quando muda serviço, profissional ou dia.
  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    if (!idServico || !dia) {
      setHorarios(null);
      return;
    }
    let ativo = true;
    setHorarios(null);
    setErroHorarios(false);
    agendaPublicaService
      .horarios(slug, idServico, dia, idProfissional)
      .then((lista) => ativo && setHorarios(lista))
      .catch(() => {
        if (!ativo) return;
        setHorarios([]);
        setErroHorarios(true);
      });
    return () => {
      ativo = false;
    };
  }, [slug, idServico, idProfissional, dia, recarga]);

  const livres = useMemo(() => (horarios ? juntarHorarios(horarios) : []), [horarios]);

  const escolherServico = (id: number) => {
    setIdServico(id);
    setIdProfissional(null);
    setHora(null);
    setAviso(null);
  };

  const escolherHora = (h: string) => {
    setHora(h);
    setAviso(null);
    requestAnimationFrame(() =>
      secaoDados.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando || !idServico || !dia || !hora) return;
    const nomeLimpo = nome.trim().replace(/\s+/g, " ");
    const digitos = somenteDigitos(celular);
    if (nomeLimpo.length < 2) {
      setErros({ nome: "Informe seu nome." });
      document.getElementById("campo-nome")?.focus();
      return;
    }
    if (!validarCelular(digitos)) {
      setErros({ celular: "Informe um celular válido com DDD." });
      document.getElementById("campo-celular")?.focus();
      return;
    }
    setErros({});
    setAviso(null);
    setEnviando(true);
    try {
      const resposta = await agendaPublicaService.agendar(slug, {
        idServico,
        idFuncionario: idProfissional,
        data: dia,
        hora,
        nome: nomeLimpo,
        celular: digitos,
      });
      setMarcado(resposta);
      requestAnimationFrame(() => tituloFinal.current?.focus());
    } catch (erro) {
      setAviso(mensagemDoErro(erro, "Não deu para marcar agora. Tente de novo em instantes."));
      // O horário pode ter sido ocupado por outra pessoa: mostra a lista atualizada.
      setHora(null);
      setRecarga((n) => n + 1);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-pagina agendar-pagina">
      <main className="login-card agendar-card" data-cy="agendar">
        <div className="agendar-logo">
          <Logo variante="horizontal" titulo="Agendly" />
        </div>

        {estado.fase === "carregando" && (
          <p className="login-subtitulo" role="status">
            Carregando a agenda...
          </p>
        )}

        {estado.fase === "fechada" && (
          <>
            <h1 className="login-titulo">Agendamento online fechado</h1>
            <p className="login-subtitulo" data-cy="agendar-fechada">
              Esta loja não está recebendo agendamentos por aqui. Fale direto com a loja.
            </p>
          </>
        )}

        {estado.fase === "erro" && (
          <>
            <h1 className="login-titulo">Não deu para abrir</h1>
            <p className="login-subtitulo">Verifique sua internet e abra o link de novo.</p>
          </>
        )}

        {vitrine && marcado && (
          <section aria-live="polite" data-cy="agendar-sucesso">
            <h1 className="login-titulo" tabIndex={-1} ref={tituloFinal}>
              Horário marcado
            </h1>
            <p className="agendar-ok">
              <CalendarCheck size={20} strokeWidth={1.75} aria-hidden="true" />
              <span>
                {marcado.servico}
                {marcado.profissional ? ` com ${marcado.profissional}` : ""},{" "}
                {dias.find((d) => d.iso === marcado.data)?.dia ?? marcado.data} às{" "}
                {marcado.hora.slice(0, 5)}, em {vitrine.loja}.
              </span>
            </p>
            <Link
              to="/confirmar/$token"
              params={{ token: marcado.token }}
              className="btn btn-secundario agendar-botao"
              data-cy="agendar-ver-horario"
            >
              Ver ou cancelar meu horário
            </Link>
            <p className="texto-ajuda agendar-rodape">
              Guarde este link: é por ele que você cancela se não puder ir.
            </p>
          </section>
        )}

        {vitrine && !marcado && (
          <>
            <h1 className="login-titulo">Agendar em {vitrine.loja}</h1>
            <p className="login-subtitulo">
              {vitrine.cidade ? `${vitrine.cidade} · ` : ""}Escolha o serviço e um horário livre.
            </p>

            {vitrine.servicos.length === 0 && (
              <p className="alerta alerta-info" data-cy="agendar-sem-servicos">
                Esta loja ainda não tem serviços para agendar por aqui.
              </p>
            )}

            {vitrine.servicos.length > 0 && (
              <section className="agendar-passo" aria-labelledby="passo-servico">
                <h2 id="passo-servico" className="agendar-passo__titulo">
                  1. Serviço
                </h2>
                <div className="agendar-lista" role="radiogroup" aria-labelledby="passo-servico">
                  {vitrine.servicos.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={s.id === idServico}
                      className={`agendar-opcao${s.id === idServico ? " agendar-opcao--ativa" : ""}`}
                      onClick={() => escolherServico(s.id)}
                      data-cy={`agendar-servico-${s.id}`}
                    >
                      <span className="agendar-opcao__nome">{s.nome}</span>
                      <span className="agendar-opcao__detalhe">
                        {duracaoTexto(s.duracaoMinutos)}
                        {s.preco != null ? ` · ${formatarMoeda(s.preco)}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {servico && servico.profissionais.length > 1 && (
              <section className="agendar-passo" aria-labelledby="passo-profissional">
                <h2 id="passo-profissional" className="agendar-passo__titulo">
                  2. Profissional
                </h2>
                <div
                  className="agendar-chips"
                  role="radiogroup"
                  aria-labelledby="passo-profissional"
                >
                  {[
                    { id: null as number | null, nome: "Qualquer um" },
                    ...servico.profissionais,
                  ].map((p) => (
                    <button
                      key={p.id ?? "qualquer"}
                      type="button"
                      role="radio"
                      aria-checked={p.id === idProfissional}
                      className={`agendar-chip${p.id === idProfissional ? " agendar-chip--ativo" : ""}`}
                      onClick={() => {
                        setIdProfissional(p.id);
                        setHora(null);
                      }}
                      data-cy={`agendar-profissional-${p.id ?? "qualquer"}`}
                    >
                      {p.nome}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {servico && (
              <section className="agendar-passo" aria-labelledby="passo-dia">
                <h2 id="passo-dia" className="agendar-passo__titulo">
                  {servico.profissionais.length > 1 ? "3" : "2"}. Dia
                </h2>
                <div className="agendar-dias" role="radiogroup" aria-labelledby="passo-dia">
                  {dias.map((d) => (
                    <button
                      key={d.iso}
                      type="button"
                      role="radio"
                      aria-checked={d.iso === dia}
                      className={`agendar-dia${d.iso === dia ? " agendar-dia--ativo" : ""}`}
                      onClick={() => {
                        setDia(d.iso);
                        setHora(null);
                        setAviso(null);
                      }}
                      data-cy={`agendar-dia-${d.iso}`}
                    >
                      <span className="agendar-dia__semana">{d.semana}</span>
                      <span className="agendar-dia__data">{d.dia}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {servico && dia && (
              <section className="agendar-passo" aria-labelledby="passo-hora" aria-live="polite">
                <h2 id="passo-hora" className="agendar-passo__titulo">
                  {servico.profissionais.length > 1 ? "4" : "3"}. Horário
                </h2>
                {horarios === null && (
                  <p className="texto-ajuda" role="status">
                    Procurando horários livres...
                  </p>
                )}
                {horarios !== null && erroHorarios && (
                  <p className="alerta alerta-aviso" role="alert">
                    <span>Não deu para carregar os horários.</span>
                    <button
                      type="button"
                      className="link agendar-link"
                      onClick={() => setRecarga((n) => n + 1)}
                    >
                      Tentar de novo
                    </button>
                  </p>
                )}
                {horarios !== null && !erroHorarios && livres.length === 0 && (
                  <p className="texto-ajuda" data-cy="agendar-sem-horarios">
                    Sem horários livres neste dia. Tente outro dia
                    {idProfissional != null ? " ou outro profissional" : ""}.
                  </p>
                )}
                {livres.length > 0 && (
                  <div role="radiogroup" aria-labelledby="passo-hora">
                    {PERIODOS.map((p) => {
                      const doPeriodo = livres.filter((h) => h >= p.de && h < p.ate);
                      if (doPeriodo.length === 0) return null;
                      return (
                        <div key={p.nome} className="agendar-periodo">
                          <h3 className="agendar-periodo__nome">{p.nome}</h3>
                          <div className="agendar-horas">
                            {doPeriodo.map((h) => (
                              <button
                                key={h}
                                type="button"
                                role="radio"
                                aria-checked={h === hora}
                                className={`agendar-hora${h === hora ? " agendar-hora--ativa" : ""}`}
                                onClick={() => escolherHora(h)}
                                data-cy={`agendar-hora-${h}`}
                              >
                                {h}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {aviso && (
              <p className="alerta alerta-aviso agendar-aviso" role="alert" data-cy="agendar-aviso">
                <CircleAlert size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>{aviso}</span>
              </p>
            )}

            {servico && dia && hora && (
              <section className="agendar-passo" aria-labelledby="passo-dados" ref={secaoDados}>
                <h2 id="passo-dados" className="agendar-passo__titulo">
                  Seus dados
                </h2>
                <form onSubmit={confirmar} noValidate data-cy="agendar-form">
                  <div className="form-grade">
                    <FormField id="campo-nome" label="Seu nome" obrigatorio erro={erros.nome}>
                      <input
                        type="text"
                        name="nome"
                        autoComplete="name"
                        maxLength={80}
                        value={nome}
                        onChange={(e) => {
                          setNome(e.target.value.replace(/[^\p{L} .'-]/gu, ""));
                          setErros((er) => ({ ...er, nome: undefined }));
                        }}
                        data-cy="agendar-nome"
                      />
                    </FormField>
                    <FormField
                      id="campo-celular"
                      label="Celular (WhatsApp)"
                      obrigatorio
                      erro={erros.celular}
                      ajuda="A loja usa para confirmar o horário com você."
                    >
                      <input
                        type="tel"
                        name="celular"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        value={celular}
                        onChange={(e) => {
                          setCelular(mascaraCelular(e.target.value));
                          setErros((er) => ({ ...er, celular: undefined }));
                        }}
                        data-cy="agendar-celular"
                      />
                    </FormField>
                  </div>
                  <p className="agendar-resumo" data-cy="agendar-resumo">
                    {servico.nome}
                    {idProfissional != null
                      ? ` com ${servico.profissionais.find((p) => p.id === idProfissional)?.nome ?? ""}`
                      : ""}
                    , {dias.find((d) => d.iso === dia)?.dia} às {hora}.
                  </p>
                  <Button
                    type="submit"
                    className="agendar-botao"
                    carregando={enviando}
                    data-cy="agendar-confirmar"
                  >
                    Marcar horário
                  </Button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
