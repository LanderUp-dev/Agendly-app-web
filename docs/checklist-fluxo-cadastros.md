# Checklist: ordem dos cadastros e navegação

**Objetivo:** que um usuário novo seja levado, sem se perder, pela ordem em que os cadastros dependem uns dos outros, até chegar à agenda pronta para uso.

Levantamento feito em 07/11/2026 a partir do código do front (rotas, menu, formulários), da API (controllers e DTOs) e do documento "Requisito - Agendly.docx".

Legenda: `[x]` já funciona · `[ ]` a fazer · 🔒 depende de mudança no backend (fora do escopo do front)

---

## 1. Ordem real de dependência

Cada cadastro só pode ser feito depois que os campos obrigatórios dele têm o que escolher:

| Passo | Cadastro | Precisa antes | Rota |
|---|---|---|---|
| 1 | Criar conta e entrar | nada | `/register`, `/login` |
| 2 | **Loja** | nada | `/cadastro-loja` |
| 3 | **Áreas de atuação** | Loja | `/cadastro-area-atuacao` |
| 4 | **Funcionários** | Loja | `/cadastro-funcionario` |
| 5 | Especialidades (funcionário ↔ área) | Área e Funcionário | `/cadastro-area-funcionario` 🔒 |
| 6 | **Serviços** | Loja e Área | `/cadastro-servico` |
| 7 | **Clientes** | Loja | `/cadastro-cliente` |
| 8 | Cobrancistas (opcional) | Loja | `/cadastro-cobrancista` |
| 9 | Equipes (dar acesso a outro usuário) | Usuário e Loja | `/cadastro-equipe` 🔒 |
| 10 | **Agenda** | Funcionários (viram as colunas); Clientes e Serviços para agendar | `/agenda` |

**Caminho mínimo até a agenda útil:** Loja → Área → Funcionário → Serviço → Cliente.

---

## 2. Navegação e ordem das páginas

- [x] **Depois do login, levar quem não tem loja para o cadastro de loja.** Hoje o login sempre vai para `/agenda` (`LoginView.tsx:40` e `:113`), que fica vazia sem loja e sem funcionários. Proposta: se `GET /lojas` vier vazio, ir para `/cadastro-loja`; se não, para `/agenda`.
- [x] **Reordenar o menu principal** (`components/ds/navegacao.ts`).
  - Hoje: Agenda, Clientes, Serviços, Funcionários, Lojas. É o inverso da ordem de dependência.
  - "Áreas de atuação" está escondida em "Mais", mas é obrigatória para cadastrar serviço.
  - Proposta: Agenda | Lojas, Áreas, Funcionários, Serviços, Clientes | Mais: Especialidades, Cobrancistas, Equipes.
- [x] **"Primeiros passos" na agenda** enquanto o básico não estiver completo: um cartão com a lista Loja → Área → Funcionário → Serviço → Cliente, cada item marcado conforme já exista (contagem pelos `GET` que já existem), com link para o próximo. Some quando os 5 estiverem feitos.
- [x] **Indicar o próximo passo depois de salvar.** Hoje todo cadastro volta para a própria listagem (ex.: `CadastroLoja.tsx:93`). Proposta: na primeira loja, aviso "Loja criada. Próximo passo: cadastrar áreas de atuação" com o link, e o mesmo nos passos seguintes.
- [x] **Voltar ao formulário de origem.** Quando o select está vazio, o link "Cadastrar agora" (`SelectCarregado`) leva para outro cadastro, mas depois de salvar o usuário cai na listagem e perde o formulário que estava preenchendo. Proposta: passar `?voltar=/cadastro-servico` e, depois de salvar, voltar para lá com o item novo já selecionado.
- [x] **Selecionar sozinho quando só existe uma loja.** Em quase todos os formulários o campo Loja é obrigatório. Se houver uma só, ela já vem marcada.
- [x] **Agenda vazia com orientação.** Sem funcionários, a agenda deve mostrar "Cadastre um funcionário para ele aparecer como coluna da agenda", com link, em vez de uma grade vazia.
- [x] Select vazio explica o motivo e oferece "Cadastrar agora" (`SelectCarregado.tsx:66`).
- [x] Listagens vazias explicam a dependência: Lojas ("libera os demais cadastros"), Serviços ("antes, cadastre uma loja e uma área"), Funcionários ("viram colunas da agenda").
- [x] Rotas internas protegidas: sem sessão, o usuário vai para `/login` (`_authenticated.tsx:11`).
- [x] `/` vai para `/home`; cadastro concluído vai para `/login`.

## 3. Paginação das listagens

- [x] Busca por texto nas tabelas (`DataTable`).
- [x] **Paginação no front.** A API não pagina: os 9 `GET` de listagem devolvem tudo, sem `Pageable`. Hoje a tabela mostra todos os itens de uma vez. Proposta: paginação feita no navegador, com 20 itens por página, contador "1–20 de 134" e anterior/próxima, mantendo a busca sobre a lista inteira. É só apresentação; não muda services nem payloads.
- [ ] 🔒 **Paginação no servidor** (`?page=&size=`) só vale a pena com muitos registros e exige mudar os controllers. Fica registrada para o backend.

## 4. Bloqueios do backend que afetam o fluxo 🔒

Não serão contornados no front (a regra é não fingir sucesso):

- [ ] **Especialidades:** não existe endpoint para criar o vínculo entre funcionário e área, e o formulário de funcionário não envia áreas. A tela avisa que está indisponível.
- [ ] **Equipes:** `EquipeController` devolve 400 no POST e 500 no GET, porque os campos não são `final`. O passo 9 não funciona até isso ser corrigido.
- [ ] **Agendamento:** o modal da agenda ainda não está ligado ao `POST /agendamentos`. A API existe; falta a integração no front, que ainda não foi aprovada.
- [ ] **Fora do front por enquanto:** o requisito pede Cargos (RF15), Caixa (R6), Comanda (R7), Despesas (R8) e Recebimentos (R9). Nenhum deles tem tela, e Cargo também não tem controller.

---

## Prioridade sugerida

1. Redirecionar para o cadastro de loja depois do login (sem loja).
2. Reordenar o menu e trazer "Áreas" para o menu principal.
3. Cartão "Primeiros passos" na agenda, com o próximo passo depois de salvar.
4. `?voltar=` para retornar ao formulário de origem, e loja única pré-selecionada.
5. Paginação no front.

Os itens 1 a 5 são só navegação e apresentação: não mudam payloads, services nem o backend.

---

## Implementado (07/11/2026)

| Item | Onde |
|---|---|
| Login sem loja leva ao cadastro da loja | `src/lib/fluxoCadastro.ts` (`destinoAposLogin`), `LoginView.tsx` |
| Menu na ordem de dependência, com Áreas no menu principal | `src/components/ds/navegacao.ts` |
| Cartão "Primeiros passos" na agenda (some quando os 5 passos estão feitos ou quando o usuário oculta) | `agendaComponents/PrimeirosPassos.tsx` |
| Aviso "Próximo passo" depois de salvar, só se o próximo cadastro ainda estiver vazio | `concluirCadastro` nos 7 formulários |
| "Cadastrar agora" volta para o formulário de origem com o item novo selecionado | `SelectCarregado.tsx` e `concluirCadastro` |
| Campo obrigatório com uma única opção vem selecionado (loja, área etc.) | `SelectCarregado.tsx` (`selecionarUnico`) |
| Paginação de 20 itens nas listagens, com a busca valendo para a lista inteira | `DataTable.tsx` e `components.css` |

**Correção feita no caminho:** o filtro de profissionais da agenda era desfeito quando a lista de funcionários recarregava. Isso acontecia, por exemplo, com a segunda chamada do StrictMode no modo de desenvolvimento ou ao clicar em "Tentar novamente". Agora quem foi desmarcado continua desmarcado (`AgendaView.tsx`).

**Limitação:** ao voltar pelo "Cadastrar agora", o formulário de origem abre de novo com o item novo selecionado, mas o que já tinha sido digitado nele se perde.

**Testes:**
- Novo spec `cypress/e2e/09-fluxo-cadastros.cy.ts`, com 6 testes.
- Em `01-autenticacao`, novo teste para o login sem loja.
- Em `06-carregamento`, o teste do link "Cadastrar agora" foi ajustado para esperar o `?voltar`.
- Rodando contra o backend local (H2):
  - 01, 02, 05, 06, 08 e 09: todos passam.
  - As 3 falhas que restam são as já conhecidas do backend: Equipe 400/500 (em 03 e 04) e o hash de senha no POST /usuarios (em 07).
- tsc, os 14 testes unitários e o build: ok.
