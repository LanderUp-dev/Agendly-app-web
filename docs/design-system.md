# Design system do Agendly

Referência de tokens, componentes e regras de uso do frontend.
Princípios (inspirados no Material 3, com identidade própria): limpo, muito espaço em branco,
hierarquia tipográfica clara, poucas cores, elevação sutil e foco no conteúdo.

- Tokens: `src/styles/tokens.css`
- Base (campos, botões, alertas, tabela): `src/styles/base.css`
- Layout e feedback (navbar, página, card, estados, skeleton, modal): `src/styles/components.css`
- Componentes React: `src/components/ds/` (importe de `@/components/ds`)
- Hooks de carregamento: `src/hooks/useAtrasoLoading.ts`, `src/hooks/useCarregar.ts`

---

## 1. Tokens

O tema muda pela classe no `<body>` (`.tema-claro` / `.tema-escuro`), aplicada pelo `ThemeContext`.
Nunca use cor fixa (`#fff`, `rgba(...)`) em CSS de tela: use o token.

### Cor

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--marca` | `#007F3D` | `#007F3D` | Botão primário, seleção, barra de progresso |
| `--marca-texto` | `#007F3D` | `#47CD89` | Links e texto em verde |
| `--marca-suave` | `#EEF7F1` | verde 12% | Fundo de item ativo/hover da grade |
| `--fundo-pagina` | `#F7F8FA` | `#0C111D` | Fundo da aplicação |
| `--fundo-painel` | `#FFFFFF` | `#161B26` | Cards, navbar, modal, tabela |
| `--fundo-elevado` / `--fundo-hover` | `#F2F4F7` | `#1F242F` | Cabeçalho de tabela, hover |
| `--texto-principal` | `#101828` | `#F5F5F6` | Texto |
| `--texto-secundario` | `#475467` | `#CECFD2` | Descrições, rótulos de apoio |
| `--texto-terciario` | `#5D6679` | `#A2A5AB` | Placeholder, metadados |
| `--borda-sutil` | `#E4E7EC` | `#2B303B` | Divisórias e contorno de card |
| `--campo-borda` | `#7C8798` | `#7A7F8A` | Contorno de campos (≥ 3:1) |
| `--foco-anel` | `#175CD3` | `#84CAFF` | Anel de foco de teclado |
| `--erro` / `--aviso` / `--info` / `--sucesso` | ver arquivo | ver arquivo | Estados (texto + `-fundo`) |
| `--ag-{verde,azul,ambar,roxo,rosa,cinza}-{fundo,texto,borda}` | suaves | escuros | Cores de agendamento |

Todos os pares texto/fundo têm contraste ≥ 4,5:1 e bordas de controle/foco ≥ 3:1 (conferidos por script).

### Tipografia

Família **Inter**; números com `font-variant-numeric: tabular-nums` em horários e documentos.

| Token | Tamanho | Uso |
|---|---|---|
| `--texto-xs` | 12 px | Metadados, cabeçalho de tabela, ajuda |
| `--texto-sm` | 14 px | Texto de interface, tabelas, rótulos |
| `--texto-md` | 16 px | Campos (evita zoom no iOS), corpo |
| `--texto-lg` | 20 px | Título de modal/seção |
| `--texto-xl` | 24 px | Título de página (PageHeader) |
| `--texto-2xl` | 32 px | Título da tela de login |

Pesos: 400 (texto), 500 (rótulos), 600 (títulos e botões). Sem caixa alta em botões e títulos.

### Espaçamento, raio, elevação, camadas, movimento

- Espaçamento base 4 px: `--esp-1` (4) … `--esp-16` (64). Ritmo de 8 px entre blocos.
- Raio: `--raio-md` 8 px (campos, botões), `--raio-lg` 12 px (card, modal, menu), `--raio-pill` só em badge.
- Elevação: nível 0 = só borda (padrão); `--elevacao-1` menus/toast; `--elevacao-2` modal. Nada de sombra colorida.
- Camadas: `--z-sticky` 10, `--z-navbar` 40, `--z-dropdown` 50, `--z-toast` 900, `--z-modal` 1000, `--z-progresso` 1100.
- Movimento: `--duracao-rapida` 100 ms, `--duracao` 150 ms, `--duracao-lenta` 200 ms. Com
  `prefers-reduced-motion`, animações e shimmer são desligados.

### Layout

- Largura máxima `--largura-max` 1200 px; margem lateral `--margem-pagina` 16 / 24 / 32 px (mobile / tablet / desktop).
- Grade de 12 colunas (`.grade`, `.col-*`); formulários usam `.form-grade` com `FormField colunas={6|4|3|8}`.
- Breakpoints: mobile < 768 px, tablet 768–1023 px, desktop ≥ 1024 px.

---

## 2. Logo e Navbar

- Logo em SVG (`<Logo />`), símbolo em grade 24 × 24 (folha de calendário com "A" e ponto de horário).
- Variantes: `horizontal` (símbolo + nome), `simbolo` e `auto` (horizontal; abaixo de **360 px** troca para só o símbolo).
  `claro` força branco para uso sobre foto. No tema escuro as cores vêm dos tokens.
- Altura do logo: `--logo-altura` 28 px (desktop) / 24 px (mobile); mínimo `--logo-minimo` 20 px. A largura sai do
  `viewBox`: o logo **nunca é esticado**.
- Área de respiro: igual à altura do símbolo (o `gap` da navbar e a margem lateral nunca são menores).
- Navbar (`AppNavbar`): altura fixa 64 px desktop / 56 px mobile, logo centralizado na vertical e alinhado à mesma
  margem lateral do conteúdo; o nome do logo usa a mesma linha de base dos links.
  Tablet/mobile: links principais vão para o menu (botão com `aria-expanded`).

---

## 3. Componentes

| Componente | Onde | Notas |
|---|---|---|
| `Button` | `ds/Button.tsx` | `variante` primario/secundario/fantasma/perigo; `carregando` mostra spinner, troca o texto ("Salvando..."), desabilita e marca `aria-busy`, mantendo a largura |
| `ButtonLink` | `ds/Button.tsx` | Navegação com aparência de botão |
| Input / Select / Textarea | classes `.campo` ou dentro de `.campo-wrapper` | Estados: hover, foco (anel azul), erro (`aria-invalid` ou `:user-invalid`), desabilitado |
| `FormField` | `ds/FormField.tsx` | Rótulo sempre visível + ajuda + erro junto ao campo; liga `id`, `aria-describedby`, `aria-invalid`, `required`; `carregando` mostra spinner no select |
| `Card` | `ds/Layout.tsx` | Superfície com borda, raio 12 px, sem sombra |
| `PageHeader` | `ds/Layout.tsx` | Título (h1), descrição, link "voltar" e ações |
| `Badge` | `ds/Layout.tsx` | Status curtos (pílula) |
| `DataTable` | `ds/DataTable.tsx` | Busca, contagem, skeleton nas dimensões finais, vazio, erro com "Tentar novamente"; vira lista no mobile |
| `Modal` | `ds/Modal.tsx` | Foco inicial, Tab preso, Esc/clique fora fecham, foco volta |
| `EmptyState` / `ErrorState` | `ds/Feedback.tsx` | Ícone + título + texto + ação |
| `Skeleton` / `Spinner` / `Carregando` | `ds/Feedback.tsx`, `ds/Spinner.tsx` | Ver seção 4 |
| `AppNavbar` / `AppPagina` | `ds/AppNavbar.tsx`, `ds/AppPagina.tsx` | Shell das páginas internas (+ link "Pular para o conteúdo") |
| `ProgressoRota` | `ds/ProgressoRota.tsx` | Barra fina no topo na troca de rota (> 150 ms) |
| `SelectCarregado` | `ds/SelectCarregado.tsx` | Select que depende da API: desabilitado + spinner + "Carregando lojas...", vazio com "Cadastrar agora", erro com "Tentar novamente" |
| `PaginaListagem` | `ds/PaginaListagem.tsx` | Página padrão de listagem (PageHeader + botão "Novo" + DataTable) |
| `useErrosFormulario` | `hooks/useErrosFormulario.ts` | `falhar(campo, msg)`: erro junto ao campo + toast + foco no campo (`campo-<nome>`) |
| Toast | `sonner` + `.toast` | Erros de API vêm do interceptor do axios; fica abaixo da navbar (`offset` 72 px) |

### Formulários

- Estrutura: `PageHeader` (com link "voltar" para a listagem) → `Card.form-card` → `.form-grade` (12 colunas)
  → `.form-rodape` com "Cancelar" (secundário) e a ação principal à direita.
- Rótulo sempre visível; placeholder só como exemplo de formato (`000.000.000-00`).
- Erro de validação: junto ao campo (`FormField erro`), com `aria-invalid` e foco no campo; o toast repete a mensagem.
- Documentos e telefones: máscara na digitação, **só dígitos no payload**, formatados de novo só na exibição
  (`src/lib/formatadores.ts`).

### Agenda

- Hierarquia: barra (data + navegação + granularidade) → cabeçalho de profissionais fixo → coluna de horas fixa → grade.
- Granularidade 15 / 30 / 60 min em controle segmentado (rádios acessíveis); linha de 32 / 44 / 64 px.
- Cor do agendamento **por serviço**, com tons da paleta `--ag-*` (todos AA) e borda lateral; a legenda na lateral
  usa a mesma função (`coresAgenda.ts`), então cor e legenda sempre batem.
- Teclado: cada horário é focável (Enter abre o modal); modal com foco preso, Esc fecha e devolve o foco.
- Tablet/mobile: a lateral vira painel deslizante ("Calendário e filtros"), Esc fecha.

Ícones: **um único conjunto**, `lucide-react`, 16–20 px, `strokeWidth={1.75}`, sempre com `aria-hidden` quando
acompanham texto e `aria-label` no botão quando estão sozinhos.

---

## 4. Carregamentos

Regra de tempo (hook `useAtrasoLoading(carregando, 300)` e componente `<Carregando>`):

| Tempo | O que mostrar |
|---|---|
| < 300 ms | Nada (evita piscar) |
| 300 ms – 2 s | Skeleton nas dimensões do conteúdo final, ou spinner discreto |
| 2 s – 10 s | + mensagem de contexto ("Carregando clientes...") |
| > 10 s | Aviso de lentidão + "Tentar novamente" |

- Dados de tela: `useCarregar(service.listar, [])` → `{ dados, carregando, erro, recarregar }`.
  O erro é classificado (timeout de 15 s do axios, rede, servidor, acesso) e mostrado **na tela** com
  `ErrorState` + "Tentar novamente" (o toast do interceptor continua).
- Selects dependentes: `FormField carregando` + `disabled` enquanto a lista carrega; texto claro quando vazia
  ("Nenhuma loja cadastrada").
- Envio: `Button carregando` (spinner, "Salvando...", `disabled`, `aria-busy`).
- Mensagens de carregamento ficam em região `aria-live="polite"`; com `prefers-reduced-motion` não há shimmer.

---

## 5. O que NÃO fazer

- Gradientes decorativos, sombras coloridas ou pesadas, cantos de 24 px+ em tudo.
- Emojis ou caracteres (`←`, `+`, `#`, `✓`) como ícone: use `lucide-react`.
- Placeholder no lugar de rótulo; texto em CAIXA ALTA em botões e títulos.
- Card dentro de card; grade de cards idênticos para dados tabulares (use `DataTable`).
- Cor fixa em CSS de tela; logo em PNG ou com `width` e `height` fixos (distorce).
- Loading que aparece em respostas rápidas, tela parada sem feedback em respostas lentas, ou erro só em toast.
- `<style>` inline para autofill: o tratamento global em `base.css` já acompanha o tema.
- Texto de marketing vazio na interface ("a fluidez que seu negócio merece"): seja direto.
