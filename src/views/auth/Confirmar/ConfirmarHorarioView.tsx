// @requisito RO-37
import { useEffect, useRef, useState } from "react";
import { CalendarCheck, CircleAlert } from "lucide-react";
import { Button, Logo } from "@/components/ds";
import { confirmacaoPublicaService, type ResumoConfirmacao } from "@/services/confirmacaoPublica";
import "../Login/LoginView.css";
import "./ConfirmarHorarioView.css";

const DIAS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

/** "sábado, 14/11" a partir de yyyy-MM-dd (sem fuso: a data é a do salão). */
function dataPorExtenso(iso?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return `${DIAS[d.getDay()]}, ${m[3]}/${m[2]}`;
}

type Estado =
  | { fase: "carregando" }
  | { fase: "invalido" }
  | { fase: "erro" }
  | { fase: "pronto"; resumo: ResumoConfirmacao; aviso?: string };

/**
 * Página do link enviado no WhatsApp: o cliente abre, confere o horário e toca em
 * "Sim, confirmo". Sem login. Abrir a página não confirma nada; só o toque no botão.
 */
export default function ConfirmarHorarioView({ token }: { token: string }) {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let ativo = true;
    confirmacaoPublicaService
      .ver(token)
      .then((resumo) => ativo && setEstado({ fase: "pronto", resumo }))
      .catch(
        (e) => ativo && setEstado({ fase: e?.response?.status === 404 ? "invalido" : "erro" }),
      );
    return () => {
      ativo = false;
    };
  }, [token]);

  const agir = async (acao: "confirmar" | "cancelar") => {
    if (enviando || estado.fase !== "pronto") return;
    setEnviando(true);
    try {
      const resumo = await confirmacaoPublicaService[acao](token);
      setEstado({ fase: "pronto", resumo });
      // Leva o leitor de tela (e o olho) para o resultado.
      requestAnimationFrame(() => titulo.current?.focus());
    } catch (e) {
      const resposta = (e as { response?: { status?: number; data?: unknown } })?.response;
      if (resposta?.status === 404) {
        setEstado({ fase: "invalido" });
      } else {
        const texto =
          typeof resposta?.data === "string" && resposta.status === 400
            ? resposta.data
            : acao === "cancelar"
              ? "Não deu para cancelar agora. Tente de novo em instantes."
              : "Não deu para confirmar agora. Tente de novo em instantes.";
        setEstado({ ...estado, aviso: texto });
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-pagina">
      <main className="login-card confirmar-card" data-cy="confirmar-horario">
        <div className="confirmar-logo">
          <Logo variante="horizontal" titulo="Agendly" />
        </div>

        {estado.fase === "carregando" && (
          <p className="login-subtitulo" role="status">
            Carregando seu horário...
          </p>
        )}

        {estado.fase === "invalido" && (
          <>
            <h1 className="login-titulo">Link inválido</h1>
            <p className="login-subtitulo" data-cy="confirmar-invalido">
              Não encontramos este horário. Confira se o link veio completo ou fale com a loja.
            </p>
          </>
        )}

        {estado.fase === "erro" && (
          <>
            <h1 className="login-titulo">Não deu para abrir</h1>
            <p className="login-subtitulo">
              Verifique sua internet e abra o link de novo. Se continuar, fale com a loja.
            </p>
          </>
        )}

        {estado.fase === "pronto" && (
          <Conteudo
            resumo={estado.resumo}
            aviso={estado.aviso}
            enviando={enviando}
            onConfirmar={() => agir("confirmar")}
            onCancelar={() => agir("cancelar")}
            tituloRef={titulo}
          />
        )}
      </main>
    </div>
  );
}

function Conteudo({
  resumo,
  aviso,
  enviando,
  onConfirmar,
  onCancelar,
  tituloRef,
}: {
  resumo: ResumoConfirmacao;
  aviso?: string;
  enviando: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  tituloRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const confirmado = resumo.status === "CONFIRMADO";
  const cancelado = resumo.status === "CANCELADO";
  const hora = (resumo.horaInicio ?? "").slice(0, 5);
  // Cancelar pede um segundo toque: é o único gesto da página que tira o horário do cliente.
  const [pedindoCancelar, setPedindoCancelar] = useState(false);

  const tituloTexto = confirmado
    ? "Horário confirmado"
    : resumo.podeConfirmar
      ? `${resumo.cliente ? `${resumo.cliente}, você` : "Você"} confirma este horário?`
      : cancelado
        ? "Este horário foi cancelado"
        : "Este horário não está mais aberto";

  return (
    <>
      <h1 className="login-titulo" tabIndex={-1} ref={tituloRef} data-cy="confirmar-titulo">
        {tituloTexto}
      </h1>

      <dl className="confirmar-resumo">
        <div>
          <dt>Quando</dt>
          <dd>
            {dataPorExtenso(resumo.data)}
            {hora ? ` às ${hora}` : ""}
          </dd>
        </div>
        {resumo.servico && (
          <div>
            <dt>Serviço</dt>
            <dd>{resumo.servico}</dd>
          </div>
        )}
        {resumo.profissional && (
          <div>
            <dt>Com</dt>
            <dd>{resumo.profissional}</dd>
          </div>
        )}
        {resumo.loja && (
          <div>
            <dt>Onde</dt>
            <dd>{resumo.loja}</dd>
          </div>
        )}
      </dl>

      {aviso && (
        <p className="alerta alerta-aviso" role="alert" data-cy="confirmar-aviso">
          <CircleAlert size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>{aviso}</span>
        </p>
      )}

      {confirmado && (
        <p className="confirmar-ok" role="status" data-cy="confirmar-ok">
          <CalendarCheck size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Pronto! A loja já foi avisada. Até lá.</span>
        </p>
      )}

      {resumo.podeConfirmar && (
        <Button
          type="button"
          className="confirmar-botao"
          carregando={enviando}
          onClick={onConfirmar}
          data-cy="confirmar-sim"
        >
          Sim, confirmo
        </Button>
      )}

      {cancelado && (
        <p className="texto-ajuda" role="status" data-cy="confirmar-cancelado">
          O horário foi liberado e a loja já foi avisada.
        </p>
      )}

      {resumo.podeCancelar && !pedindoCancelar && (
        <Button
          type="button"
          variante="secundario"
          className="confirmar-botao confirmar-botao--secundario"
          disabled={enviando}
          onClick={() => setPedindoCancelar(true)}
          data-cy="confirmar-nao-vou"
        >
          Não vou poder ir
        </Button>
      )}

      {resumo.podeCancelar && pedindoCancelar && (
        <div className="confirmar-cancelar" role="group" aria-label="Cancelar o horário">
          <p>Cancelar este horário? Ele fica livre para outra pessoa.</p>
          <Button
            type="button"
            variante="perigo"
            className="confirmar-botao"
            carregando={enviando}
            onClick={onCancelar}
            data-cy="confirmar-cancelar"
          >
            Sim, cancelar
          </Button>
          <Button
            type="button"
            variante="fantasma"
            className="confirmar-botao"
            disabled={enviando}
            onClick={() => setPedindoCancelar(false)}
          >
            Voltar
          </Button>
        </div>
      )}

      <p className="texto-ajuda confirmar-rodape">
        {resumo.podeCancelar
          ? "Quer trocar de horário? Responda a mensagem da loja no WhatsApp."
          : "Fale com a loja pelo WhatsApp para marcar outro horário."}
      </p>
    </>
  );
}
