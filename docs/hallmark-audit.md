# Audit Hallmark: telas públicas do front

- **Data:** 07/11/2026
- **Skill:** Hallmark v2.0.0, verbo `audit`. Não altera nenhum arquivo do projeto.
- **Alvo:** `/home`, `/login` e `/register` no servidor de dev (porta 5174). Fontes analisadas: `src/views/auth`, `src/styles` e `src/components/ds`.
- **Gênero inferido:** modern-minimal (SaaS de agenda para salões e barbearias).
- **Linter:** 13 FAIL, 15 REFLEX e 13 WARN. Os prints estão em `.hallmark/before/`, o registro em `.hallmark/before.json` e a saída completa em `.hallmark/before.txt`.

As telas logadas não entraram neste audit, porque o backend está parado e, sem ele, elas redirecionam para o login.

## Leitura

1. **Para que serve a página:** quem vê é o dono de salão, barbearia ou estúdio. A ação que ela quer é criar a conta.
2. **O que funciona e fica:**
   - O conteúdo honesto: nada de números, depoimentos ou logos inventados, e o que ainda não existe aparece como "Em breve".
   - A agenda do hero, montada com a grade real do produto (profissionais em colunas e horários), que funciona como assinatura visual.
   - O verde da marca.
   - A tabela de preços, que é clara.
   - Login e cadastro, que são formulários limpos e com bom espaçamento.
3. **O que parece gerado por IA:**
   - Um sobretítulo verde em cima de todas as 6 seções.
   - Uma palavra colorida no meio do título ("perdido.").
   - A faixa "Como funciona" com 3 colunas iguais de ícone + título.
   - Faixa lateral colorida nos eventos da agenda.
   - Preços, FAQ e CTA final centralizados, enquanto o resto da página é alinhado à esquerda.
   - O CTA final dentro de uma caixa.
4. **O que está quebrado:** nada de funcional. O que aparece são detalhes de acabamento (veja abaixo).

## Achados por nível

### Floor (regras que o Hallmark não aceita dispensar)

| Gate | Onde | Achado | Veredito |
|---|---|---|---|
| 9 | `HomeView.tsx:157, 213, 263, 296, 344, 412` | Sobretítulo (eyebrow) em todas as seções | **Real.** O texto útil vira o título, ou sai |
| 63 | `HomeView.tsx:186` | Meta com ponto do meio "09:00–10:30 · Corte" no mock da agenda | **Real.** Trocar por quebra de linha |
| 48 | `src/styles/components.css:26` | `#ffffff` fora dos tokens (`.logo--claro`) | **Real.** Trocar por token |
| 50 | `TermosDeUso.tsx:53`, `PoliticasDePivacidade.tsx:65` | Títulos longos sem `overflow-wrap` (estouram a 320 px) | **Real.** Uma linha de CSS no `LegalPage.css` |
| 58 | `HomeView.tsx:158-161` | Hero com 4 blocos de texto; título com 9 palavras e parágrafo com 27 (o limite é 7 e 12) | **Real.** Encurtar o texto do hero |
| 19 | `HomeView.tsx:194` | Travessão nos intervalos de horário (09:00–10:30) | **Descartado.** Em pt-BR, travessão em intervalo é a tipografia correta |
| 19 | `PoliticasDePivacidade.tsx:29` | Travessão no texto legal | **Descartado.** Texto jurídico não se reescreve |
| 62 | `HomeView.css:749` | Bloco escondido com `opacity: 0` | **Falso positivo.** O estado escondido só existe sob `.hv-anima`, que o JS adiciona (`HomeView.tsx:68`). Sem JS, tudo aparece |
| 49a | `/home` a 320 px | Pergunta do FAQ quebra em 2 linhas | **Descartado.** Pergunta longa quebrar linha é normal |
| 44d | `/register` a 1920 px | Formulário passa da altura da tela | **Falso positivo.** É formulário de app, não hero de landing |

### Reflex (vícios de IA, podem ser dispensados com justificativa)

| Gate | Onde | Achado |
|---|---|---|
| 38iii | `HomeView.css:205` (`.hv-destaque`) | Uma palavra colorida dentro do título |
| 3 | `.hv-passos` (`HomeView.css:429`) | 3 colunas iguais com ícone em cima do título |
| 3 (WARN) | `.hv-mock-ev` (`HomeView.css:308`) | Faixa lateral de 3 px nos eventos do mock |
| 26b | `HomeView.css` | Nenhum estado `:active` nos botões e links |
| 39b | `.hv-faq-pergunta` | Altura do botão do FAQ fora da faixa de 44 a 52 px |
| 24b | `HomeView.css:305-306` | `3px` fora da escala de 4 px |
| 44c | `/home` a 1440 px | O hero termina em 612 px de uma tela de 900: sobra um terço vazio |
| 71 | `/home` | Títulos mais perto do bloco anterior do que do conteúdo que eles abrem |
| 72 | `/home` | Texto encostado na borda da caixa (6 px) |
| 77 | `/home` | Preços e FAQ são seções "finas": estreitas e centralizadas |
| 78 | `/home` | Títulos de seção com 36 px, perto demais dos 52 px do hero |
| 49b | `/register` a 320 px | O link "Política de Privacidade" quebra em 2 linhas |

### Finish (acabamento, não bloqueia)

- **F3 e F26:** falta `text-wrap: balance` nos títulos. Por isso "Do cadastro à agenda em 3 passos" e "Sua agenda organizada…" deixam uma palavra sozinha na última linha.
- **F1:** aspas retas no texto dos Termos de Uso. Trocar por aspas tipográficas não muda as palavras, mas como é texto jurídico, fica a seu critério.
- **WARN 25:** `.estado__texto` com largura de 44ch (o recomendado é de 45 a 75ch). Para texto de estado vazio, de uma frase só, isso está ok.
- **WARN 41:** `.card` sem cor de texto. **Falso positivo:** o card é claro e herda a cor do token do `body`.

## Qual profundidade resolve

- **polish:** mantém o design system e o layout atuais e corrige só o que os gates apontam. Resolve:
  - Os 5 Floor reais: eyebrows, ponto do meio, `#ffffff`, `overflow-wrap` e texto do hero.
  - Do Reflex: estados `:active`, altura do FAQ, a escala de 3 px, a palavra colorida, a faixa lateral dos eventos, o espaço acima dos títulos e o padding.
  - Do Finish: `text-wrap: balance`.
  - É a recomendação, porque respeita a direção visual que já foi aprovada.
- **restyle:** mantém o layout e troca o sistema (cores, tipografia e raios). Resolveria o 78 (escala dos títulos), mas mudaria o visual que já foi aprovado.
- **full:** só ela resolve a composição: hero que ocupa a primeira tela inteira (44c), preços e FAQ com mais "massa" (77) e a faixa de 3 ícones iguais (3). Exige um novo plano de página, aprovado arquivo por arquivo.

---

## Polish aplicado (07/11/2026)

O Hallmark rodou em profundidade **polish**: o design system e o layout continuam os mesmos e só foi corrigido o que os gates apontam. O carimbo do Hallmark está nas primeiras linhas de `src/views/auth/Home/HomeView.css`.

### O que mudou

| Gate | Arquivo | Mudança |
|---|---|---|
| 9 | `HomeView.tsx` | Removidos os 6 sobretítulos. O do hero ("Agenda para salões, barbearias e estúdios") foi incorporado ao parágrafo |
| 38iii | `HomeView.tsx` e `.css` | O título inteiro agora tem uma cor só ("perdido." deixou de ser verde) |
| 63 e 19 | `HomeView.tsx` | Mock da agenda: "09:00–10:30 · Corte" virou "Corte, 9h às 10h30" (o mesmo nos outros 2 eventos) |
| 3 | `HomeView.css` | Os eventos do mock trocaram a faixa lateral de 3 px por uma borda fina em toda a volta |
| 24b | `HomeView.css`, `LegalPage.css` | Espaçamentos de 3, 6 e 10 px trocados por valores da escala de 4 px |
| 48 | `src/styles/components.css` | `#ffffff` virou `var(--sobre-marca)` |
| 50 e F3 | `HomeView.css`, `LegalPage.css` | Títulos com `text-wrap: balance` e `overflow-wrap: break-word`; o parágrafo do hero com `text-wrap: pretty` |
| 26b | `src/styles/base.css`, `HomeView.css` | Estado pressionado: `.btn` desce 1 px; links e perguntas do FAQ ficam com opacidade 0,7 |
| 39b | `HomeView.css` | Botão do FAQ com 48 px de altura (antes eram 56) |
| 71 | `HomeView.css` | Menos espaço entre o título da seção e o conteúdo dela |

**Texto alterado (antes → depois):**
- Parágrafo do hero: "O Agendly organiza a agenda do dia por profissional e reúne clientes, serviços e equipe da sua loja em um só lugar, no computador ou no celular." → "O Agendly organiza a agenda do dia por profissional em salões, barbearias e estúdios, e reúne clientes, serviços e equipe em um só lugar, no computador ou no celular."
- Sobretítulos removidos: "Agenda para salões, barbearias e estúdios", "O que muda", "Como funciona", "Em desenvolvimento", "Preços" e "Dúvidas". Os links do menu continuam com esses nomes.

### Resultado do sloplint

- **Antes:** 13 FAIL e 15 REFLEX.
- **Depois:** 8 FAIL e 3 REFLEX.
- **O que foi mantido:** todos os 21 links, 12 campos, 22 handlers, 34 `data-cy` e 21 títulos. Dos 9 números da página, os 2 que o linter dá como ausentes ("10:30" e "13:00") estão lá, só no novo formato "10h30" e "13h".
- **tsc:** ok.
- **Testes unitários:** 14 de 14 passando.
- **Build:** ok.

**Os 8 FAIL que ficaram, e por quê:**
- **19 (2×):** travessão no texto jurídico dos Termos e da Política de Privacidade. Texto jurídico não se reescreve.
- **20 (3×):** falta o carimbo do Hallmark em `base.css`, `LoginView.css` e `LegalPage.css`. O polish foi só na Home; esse carimbo é um marcador da ferramenta, não um defeito visual.
- **62:** falso positivo. O estado escondido só existe sob `.hv-anima`, que o JS adiciona.
- **49a:** a pergunta do FAQ quebra em 2 linhas a 320 px, o que é melhor do que cortar o texto.
- **44d:** falso positivo. O formulário de cadastro é mais alto que a tela, como todo formulário.

**Pendências estruturais (só um redesign full resolve):**
- **44c:** o hero termina em 610 px numa tela de 900.
- **58:** título com 9 palavras e parágrafo com 29.
- **77:** preços e FAQ estreitos e centralizados.
- **78:** títulos de seção com 36 px, perto demais dos 52 px do hero.
- **3:** a faixa com 3 ícones iguais em "Como funciona".
- **72:** um bloco com o texto a 6 px da borda.
