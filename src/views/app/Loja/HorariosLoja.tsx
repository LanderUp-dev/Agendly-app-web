// @requisito RO-38 RE-17
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button, Card, Carregando, ErrorState, PageHeader } from "@/components/ds";
import api from "@/config/axios";
import { useCarregar } from "@/hooks/useCarregar";
import { obterLojaAtiva } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";

/** Backend: HorarioFuncionamentoController (1 = segunda … 7 = domingo; horários "HH:mm:ss"). */
interface DiaApi {
  diaSemana: number;
  abertura: string;
  fechamento: string;
  intervaloInicio?: string | null;
  intervaloFim?: string | null;
}

interface DiaForm {
  diaSemana: number;
  aberto: boolean;
  abertura: string;
  fechamento: string;
  temIntervalo: boolean;
  intervaloInicio: string;
  intervaloFim: string;
}

const NOMES = ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const hhmm = (t?: string | null) => (t ?? "").slice(0, 5);

const semanaPadrao = (): DiaForm[] =>
  [1, 2, 3, 4, 5, 6, 7].map((d) => ({
    diaSemana: d,
    aberto: false,
    abertura: "09:00",
    fechamento: "18:00",
    temIntervalo: false,
    intervaloInicio: "12:00",
    intervaloFim: "13:00",
  }));

/**
 * Horário de funcionamento da loja (motor de horários). Agendamentos fora dele são recusados
 * e os horários livres para agendar saem daqui. Sem nenhum dia aberto = sem restrição.
 */
export default function HorariosLoja() {
  const loja = obterLojaAtiva();
  const podeEditar = temPermissao("LOJA_EDITAR");
  const atual = useCarregar<DiaApi[]>(
    () => api.get<DiaApi[]>("/horarios-funcionamento").then((r) => r.data),
    [],
  );
  const [dias, setDias] = useState<DiaForm[]>(semanaPadrao);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (atual.carregando) return;
    const base = semanaPadrao();
    atual.dados.forEach((d) => {
      const alvo = base[d.diaSemana - 1];
      if (!alvo) return;
      alvo.aberto = true;
      alvo.abertura = hhmm(d.abertura);
      alvo.fechamento = hhmm(d.fechamento);
      alvo.temIntervalo = !!d.intervaloInicio;
      if (d.intervaloInicio) alvo.intervaloInicio = hhmm(d.intervaloInicio);
      if (d.intervaloFim) alvo.intervaloFim = hhmm(d.intervaloFim);
    });
    setDias(base);
  }, [atual.carregando, atual.dados]);

  const mudar = (diaSemana: number, campo: keyof DiaForm, valor: string | boolean) =>
    setDias((lista) =>
      lista.map((d) => (d.diaSemana === diaSemana ? { ...d, [campo]: valor } : d)),
    );

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = dias
      .filter((d) => d.aberto)
      .map((d) => ({
        diaSemana: d.diaSemana,
        abertura: d.abertura,
        fechamento: d.fechamento,
        intervaloInicio: d.temIntervalo ? d.intervaloInicio : null,
        intervaloFim: d.temIntervalo ? d.intervaloFim : null,
      }));
    setSalvando(true);
    try {
      await api.put("/horarios-funcionamento", payload);
      toast.success(
        payload.length
          ? "Horário de funcionamento salvo."
          : "Horários removidos: a agenda fica sem restrição de horário.",
      );
      atual.recarregar();
    } catch {
      // mensagem do backend pelo interceptor
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Horários da loja"
        descricao={
          loja
            ? `Quando “${loja.nomeLoja}” atende. Agendamentos fora destes horários são recusados.`
            : undefined
        }
      />
      {atual.carregando && <Carregando ativo contexto="Carregando horários..." />}
      {!atual.carregando && atual.erro && (
        <ErrorState mensagem={atual.erro.mensagem} onTentarNovamente={atual.recarregar} />
      )}
      {!atual.carregando && !atual.erro && (
        <Card como="section" className="form-card">
          {atual.dados.length === 0 && (
            <p className="texto-ajuda" data-cy="horarios-sem-restricao">
              Nenhum horário configurado: hoje a agenda aceita qualquer horário.
            </p>
          )}
          <form onSubmit={salvar} data-cy="form-horarios">
            <fieldset disabled={!podeEditar || salvando} className="horarios-semana">
              <legend className="sr-only">Dias da semana</legend>
              {dias.map((d) => (
                <div
                  key={d.diaSemana}
                  className={`horarios-dia ${d.aberto ? "" : "horarios-dia--fechado"}`}
                  data-cy={`dia-${d.diaSemana}`}
                >
                  <label className="opcao-inline horarios-dia__nome">
                    <input
                      type="checkbox"
                      checked={d.aberto}
                      onChange={(e) => mudar(d.diaSemana, "aberto", e.target.checked)}
                      data-cy={`aberto-${d.diaSemana}`}
                    />
                    {NOMES[d.diaSemana]}
                  </label>
                  {d.aberto ? (
                    <>
                      <label className="horarios-dia__campo">
                        Abre
                        <input
                          type="time"
                          value={d.abertura}
                          onChange={(e) => mudar(d.diaSemana, "abertura", e.target.value)}
                          data-cy={`abertura-${d.diaSemana}`}
                        />
                      </label>
                      <label className="horarios-dia__campo">
                        Fecha
                        <input
                          type="time"
                          value={d.fechamento}
                          onChange={(e) => mudar(d.diaSemana, "fechamento", e.target.value)}
                          data-cy={`fechamento-${d.diaSemana}`}
                        />
                      </label>
                      <label className="opcao-inline">
                        <input
                          type="checkbox"
                          checked={d.temIntervalo}
                          onChange={(e) => mudar(d.diaSemana, "temIntervalo", e.target.checked)}
                          data-cy={`intervalo-${d.diaSemana}`}
                        />
                        Intervalo
                      </label>
                      {d.temIntervalo && (
                        <span className="horarios-dia__intervalo">
                          <input
                            type="time"
                            aria-label={`Início do intervalo de ${NOMES[d.diaSemana]}`}
                            value={d.intervaloInicio}
                            onChange={(e) => mudar(d.diaSemana, "intervaloInicio", e.target.value)}
                          />
                          <span aria-hidden="true">até</span>
                          <input
                            type="time"
                            aria-label={`Fim do intervalo de ${NOMES[d.diaSemana]}`}
                            value={d.intervaloFim}
                            onChange={(e) => mudar(d.diaSemana, "intervaloFim", e.target.value)}
                          />
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="horarios-dia__fechado">Fechado</span>
                  )}
                </div>
              ))}
            </fieldset>
            {podeEditar ? (
              <div className="form-acoes">
                <Button type="submit" disabled={salvando} data-cy="salvar-horarios">
                  {salvando ? "Salvando..." : "Salvar horários"}
                </Button>
              </div>
            ) : (
              <p className="texto-ajuda">Só quem gerencia a loja pode alterar os horários.</p>
            )}
          </form>
        </Card>
      )}
    </Layout>
  );
}
