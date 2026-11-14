// @requisito RO-44
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Layout } from "@/components/layout/Layout";
import { Button, Card, Carregando, ErrorState, FormField, PageHeader } from "@/components/ds";
import { useCarregar } from "@/hooks/useCarregar";
import { obterLojaAtiva } from "@/lib/auth";
import { temPermissao } from "@/lib/permissoes";
import { agendaOnlineService, linkAgendar, type ConfigAgendaOnline } from "@/services/agendaOnline";

const ANTECEDENCIAS = [
  { minutos: 0, rotulo: "Sem antecedência" },
  { minutos: 30, rotulo: "30 minutos" },
  { minutos: 60, rotulo: "1 hora" },
  { minutos: 120, rotulo: "2 horas" },
  { minutos: 240, rotulo: "4 horas" },
  { minutos: 720, rotulo: "12 horas" },
  { minutos: 1440, rotulo: "1 dia" },
];
const DIAS = [7, 15, 30, 60, 90];

async function copiar(texto: string, oQue: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success(`${oQue} copiado.`);
  } catch {
    toast.warning("Não deu para copiar. Selecione o texto e copie manualmente.");
  }
}

/**
 * Agendamento online da loja: liga/desliga o link público em que o cliente marca sozinho,
 * escolhe o endereço e os limites. Só quem pode editar a loja altera.
 */
export default function AgendamentoOnline() {
  const loja = obterLojaAtiva();
  const podeEditar = temPermissao("LOJA_EDITAR");
  const atual = useCarregar<ConfigAgendaOnline | null>(() => agendaOnlineService.ver(), null);
  const [form, setForm] = useState<ConfigAgendaOnline | null>(null);
  const [erroSlug, setErroSlug] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (atual.dados) setForm(atual.dados);
  }, [atual.dados]);

  const link = linkAgendar(atual.dados?.slug);
  const mensagem = link
    ? `Olá! Para marcar seu horário${loja ? ` na ${loja.nomeLoja}` : ""}, é só tocar aqui e escolher um horário livre: ${link}`
    : "";

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || salvando) return;
    const slug = form.slug.trim().toLowerCase();
    if (!/^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])$/.test(slug)) {
      setErroSlug(
        "Use de 3 a 60 letras minúsculas, números e hífen, sem espaço nem acento (ex.: barbearia-do-ze).",
      );
      document.getElementById("campo-slug")?.focus();
      return;
    }
    setErroSlug(null);
    setSalvando(true);
    try {
      const salvo = await agendaOnlineService.salvar({ ...form, slug });
      setForm(salvo);
      atual.recarregar();
      toast.success(salvo.ativo ? "Agendamento online ligado." : "Agendamento online desligado.");
    } catch {
      // Mensagem do backend exibida pelo interceptor do axios.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Layout>
      <PageHeader
        titulo="Agendamento online"
        descricao="Um link da sua loja em que o cliente escolhe o serviço e marca sozinho um horário livre."
      />
      {atual.carregando && <Carregando ativo contexto="Carregando configuração..." />}
      {!atual.carregando && atual.erro && (
        <ErrorState mensagem={atual.erro.mensagem} onTentarNovamente={atual.recarregar} />
      )}
      {!atual.carregando && !atual.erro && form && (
        <>
          <Card como="section" className="form-card">
            <form onSubmit={salvar} noValidate data-cy="form-agendamento-online">
              <fieldset disabled={!podeEditar || salvando} className="fieldset-limpo">
                <div className="opcao-inline-linha">
                  <label className="opcao-inline">
                    <input
                      id="campo-ativo"
                      type="checkbox"
                      checked={form.ativo}
                      onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                      data-cy="online-ativo"
                    />
                    Aceitar agendamentos pelo link
                  </label>
                </div>
                <div className="form-grade">
                  <FormField
                    id="campo-slug"
                    label="Endereço da sua página"
                    obrigatorio
                    erro={erroSlug}
                    ajuda="É o final do link. Se trocar, o link antigo para de funcionar."
                  >
                    <input
                      type="text"
                      name="slug"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      maxLength={60}
                      value={form.slug}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                        });
                        setErroSlug(null);
                      }}
                      data-cy="online-slug"
                    />
                  </FormField>
                  <FormField
                    id="campo-antecedencia"
                    label="Antecedência mínima"
                    colunas={6}
                    ajuda="Quanto tempo antes o cliente precisa marcar."
                  >
                    <select
                      name="antecedenciaMinutos"
                      value={form.antecedenciaMinutos}
                      onChange={(e) =>
                        setForm({ ...form, antecedenciaMinutos: Number(e.target.value) })
                      }
                      data-cy="online-antecedencia"
                    >
                      {!ANTECEDENCIAS.some((a) => a.minutos === form.antecedenciaMinutos) && (
                        <option value={form.antecedenciaMinutos}>
                          {form.antecedenciaMinutos} minutos
                        </option>
                      )}
                      {ANTECEDENCIAS.map((a) => (
                        <option key={a.minutos} value={a.minutos}>
                          {a.rotulo}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField
                    id="campo-dias"
                    label="Agenda aberta até"
                    colunas={6}
                    ajuda="Quantos dias à frente o cliente enxerga."
                  >
                    <select
                      name="diasAFrente"
                      value={form.diasAFrente}
                      onChange={(e) => setForm({ ...form, diasAFrente: Number(e.target.value) })}
                      data-cy="online-dias"
                    >
                      {!DIAS.includes(form.diasAFrente) && (
                        <option value={form.diasAFrente}>{form.diasAFrente} dias</option>
                      )}
                      {DIAS.map((d) => (
                        <option key={d} value={d}>
                          {d} dias
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </fieldset>
              {podeEditar ? (
                <div className="form-rodape">
                  <Button type="submit" carregando={salvando} data-cy="online-salvar">
                    Salvar
                  </Button>
                </div>
              ) : (
                <p className="texto-ajuda">Só quem pode editar a loja altera esta configuração.</p>
              )}
            </form>
          </Card>

          {atual.dados?.ativo && link && (
            <Card como="section" className="form-card" data-cy="online-link">
              <h2 className="card__secao-titulo">Seu link</h2>
              <p className="online-link">
                <a href={link} target="_blank" rel="noopener noreferrer" className="link">
                  {link}
                </a>
              </p>
              <div className="online-acoes">
                <Button type="button" onClick={() => copiar(link, "Link")} data-cy="online-copiar">
                  Copiar link
                </Button>
                <Button
                  type="button"
                  variante="secundario"
                  onClick={() => copiar(mensagem, "Mensagem")}
                  data-cy="online-copiar-mensagem"
                >
                  Copiar mensagem para o WhatsApp
                </Button>
              </div>
              <p className="texto-ajuda">
                Dica: no WhatsApp Business, cole a mensagem em Ferramentas comerciais &gt; Mensagem
                de saudação. Quem escrever para a loja recebe o link sozinho. Os horários seguem a
                agenda e os horários de funcionamento; cada agendamento aparece no sininho.
              </p>
            </Card>
          )}
          {!atual.dados?.ativo && (
            <p className="texto-ajuda" data-cy="online-desligado">
              Desligado: quem abrir o link vê que a loja não está recebendo agendamentos por ali.
            </p>
          )}
        </>
      )}
    </Layout>
  );
}
