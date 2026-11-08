# Relatório de testes E2E — Agendly

> Gerado por `npm run cy:report` a partir dos resultados do Cypress. Não editar à mão:
> classificações e causas ficam em `cypress/classificacao-falhas.json`.

## Execução

| Item | Valor |
|---|---|
| Data/hora | 07/11/2026, 15:08:13 |
| URL testada | http://localhost:5174 |
| Ambiente | local sem Docker: Vite dev (proxy /api) + backend Spring real (perfil prod) com H2 em memória |
| Commit | sem repositório Git |
| Versões | Cypress 14.5.4, Node v24.11.0, axe-core 4.10.3 |
| Duração | 3 min 24 s |

## Totais

| Specs | Testes | Passou | Falhou | Pendente/ignorado |
|---|---|---|---|---|
| 8 | 83 | 79 | 3 | 1 |

## Por área

| Área | Testes | Passou | Falhou | Pendente |
|---|---|---|---|---|
| Autenticação | 7 | 7 | 0 | 0 |
| Cadastro de conta | 8 | 8 | 0 | 0 |
| Cadastros | 17 | 15 | 1 | 1 |
| Listagens | 16 | 15 | 1 | 0 |
| Agenda | 6 | 6 | 0 | 0 |
| Carregamento | 9 | 9 | 0 | 0 |
| Segurança | 6 | 5 | 1 | 0 |
| Acessibilidade | 14 | 14 | 0 | 0 |

## Falhas

### Cadastros › Equipe › vincula usuário à loja

- **Classificação:** Dependência de backend
- **Causa provável:** EquipeController usa @RequiredArgsConstructor com campos NÃO final: EquipeService, UsuarioService, LojaService e CargoService ficam nulos. O converter dá NullPointerException, capturada e devolvida como 400 sem mensagem. Correção no backend: declarar os campos como `private final`.
- **Passo a passo:** Logar → /cadastro-equipe → escolher usuário e loja → Vincular. O front envia { idUsuario, idLoja } numéricos (conferido); o backend responde 400.
- **Erro:** `AssertionError: status do POST /equipes: expected 400 to equal 201`
- **Evidência:** ![print](relatorio-evidencias/Cadastros_--_Equipe_--_vincula_usu%C3%A1rio_%C3%A0_loja_(failed).png)

### Listagens › Equipes › carrega com dados reais da API

- **Classificação:** Dependência de backend
- **Causa provável:** GET /api/v1/equipes responde 500 pelo mesmo motivo (service nulo no EquipeController). A tela mostra corretamente o estado de erro com "Tentar novamente"; o teste falha porque espera 200.
- **Passo a passo:** Logar → /listagem-equipes. A API responde 500.
- **Erro:** `AssertionError: Timed out retrying after 8000ms: expected 500 to equal 200`
- **Evidência:** ![print](relatorio-evidencias/Listagens_--_Equipes_--_carrega_com_dados_reais_da_API_(failed).png)

### Segurança › PENDENTE (backend): POST /usuarios não deveria devolver o hash da senha

- **Classificação:** Dependência de backend (segurança)
- **Causa provável:** UsuarioController.post devolve a entidade Usuario em vez de UsuarioDTO, incluindo o hash BCrypt do campo `senha`. Correção no backend: responder com UsuarioDTO.create(usuario) (o DTO já marca senha como WRITE_ONLY).
- **Passo a passo:** POST /api/v1/usuarios com dados válidos → a resposta 201 contém `senha: $2a$10$...`.
- **Erro:** `AssertionError: resposta do cadastro: expected { Object (id, nome, ...) } to not have property 'senha'`

## Pendentes (ignorados com motivo)

- Cadastros › Área x Funcionário › PENDENTE (backend): criar vínculo Área x Funcionário — não há endpoint

## Observações do ambiente

- Execução local SEM Docker (o Docker Desktop não inicia nesta máquina): frontend em Vite dev (proxy /api) + backend Spring real (mesmo jar, perfil prod, config de config/) com H2 em memória no lugar do Postgres. O H2 entra só no classpath da execução (loader.path), sem mudar o pom.
- No lab (Ubuntu + Docker) rode `npm run test:e2e` com CYPRESS_BASE_URL apontando para o Nginx e um banco só de testes.
- Execução 1 (antes das correções): 26 falhas. Três causas: (a) bug de frontend — Login e Cadastro de conta são SSR e um clique antes da hidratação fazia envio nativo do formulário, sem chamar a API (corrigido: botões desabilitados até hidratar); (b) comandos do Cypress descartados pelo bundler porque o package.json tem "sideEffects": false (corrigido no suporte dos testes); (c) 403 com token de assinatura inválida não encerrava a sessão (corrigido no interceptor do axios).
- Teste de erro 500 ajustado: no modo dev o React (StrictMode) chama o efeito duas vezes, então o mock passou a falhar até o clique em "Tentar novamente".
- Confirmado que o ClienteDTO.sobreNome é copiado para Cliente.sobrenome (o risco apontado na análise não se confirmou).
- Limpeza: não há exclusão em lote no backend. Os dados criados usam sufixo único e e-mails @e2e.test; no lab, apague o volume do banco de testes (docker compose -p agendly-teste down -v).

## Recomendações (prioridade)

1. Backend — tornar `final` os campos do EquipeController (destrava cadastro e listagem de equipes e o login com contexto de loja).
2. Backend — POST/PUT /usuarios devem responder UsuarioDTO, sem o hash da senha. O mesmo vale para GET /equipes, que devolve a entidade.
3. Backend — criar controller de AreaFuncionario e de Cargo; hoje o vínculo Área x Funcionário e o cargo na equipe não têm como ser gravados (testes marcados como pendentes).
4. Backend — devolver erros de validação/duplicidade como mensagem própria (hoje vem SQL cru em 400) e configurar AuthenticationEntryPoint (401 em vez de 403 para sessão inválida).
5. Backend — corrigir os testes unitários que não compilam (EquipeDTOTest, EquipeServiceTest) para voltar a rodar `mvn test` no CI.
6. Frontend — integrar o modal de agendamento à API (POST /agendamentos) e, depois, o arrastar-e-soltar (PUT); hoje a tela informa que não salva.
7. Lab — rodar esta suíte no Docker com Postgres de teste e anexar o relatório gerado.

---

Relatório HTML completo: `cypress/reports/html/index.html`.
