# Agendly — Front

Interface web do Agendly, sistema de agenda e financeiro para salões, barbearias e estúdios. A API
fica em [Agendly-api](https://github.com/LanderUp-dev/Agendly-api).

**Stack:** React 19 · TypeScript · TanStack Start/Router (SSR com servidor Node) · Vite · axios ·
recharts · Vitest · Cypress.

## Como usar o sistema

Manual para donos e equipe: [docs/manual-de-uso.md](docs/manual-de-uso.md).

## Rodar localmente

Pré-requisitos: Node 24 e a API rodando (ver o README da API).

```bash
npm ci
npm run dev            # http://localhost:5173 ; /api é repassado para http://localhost:8080
```

- Outra API: `VITE_API_PROXY_TARGET=http://localhost:8081 npm run dev`.
- Um segundo servidor de dev na mesma pasta (por exemplo, para o Cypress) precisa de cache
  próprio: `VITE_CACHE_DIR=node_modules/.vite-e2e`. Sem isso os dois disputam o cache e as
  páginas falham com "504 Outdated Optimize Dep".

Lab Docker com Nginx (como em produção): [LAB.md](LAB.md).

## Testes

```bash
npm run test:run       # unitários (vitest)
npx tsc --noEmit       # tipos
npm run lint           # ESLint + Prettier
npm run cy:run         # E2E (Cypress) contra http://localhost:5173
npm run test:e2e       # sobe o lab, roda o Cypress e gera o relatório
```

O Cypress precisa de `CYPRESS_USER_EMAIL` e `CYPRESS_USER_PASSWORD` (ou `cypress.env.json`, fora do
Git). Para rodar a suíte inteira, a API de teste deve estar com `LIMITE_TENTATIVAS_ATIVO=false`,
porque a suíte cria muitas contas do mesmo IP. A spec de recuperação de senha lê o código no
Mailpit (`CYPRESS_MAILPIT_URL`, padrão `http://localhost:8025`).

## Estrutura

```
src/
  routes/              rotas (arquivo = URL); _authenticated.* exige login
  views/app/<Tela>/    telas do sistema (agenda, caixa, cargos...)
  views/auth/          login, cadastro, recuperação de senha, página inicial
  components/ds/       componentes do design system (barra, botões, modal, sininho...)
  services/            chamadas à API (axios)
  lib/                 sessão, permissões, dinheiro, senha
  config/axios.ts      erros da API → mensagens; sessão expirada; 402/403/429
cypress/e2e/           testes de tela (01 a 22)
nginx/nginx.conf       proxy, headers de segurança, CSP e limite de tentativas
```

## Documentação

| Documento | Para quê |
|---|---|
| [docs/manual-de-uso.md](docs/manual-de-uso.md) | Manual de uso |
| [docs/design-system.md](docs/design-system.md) | Cores, tipografia e componentes |
| [docs/relatorio-testes.md](docs/relatorio-testes.md) | Último relatório do E2E |
| [LAB.md](LAB.md) | Lab Docker (front + Nginx) |
| Produção | [Agendly-api/docs/producao.md](https://github.com/LanderUp-dev/Agendly-api/blob/main/docs/producao.md) |

## Convenções

- Permissões: `temPermissao("X")` esconde o que o cargo não pode. Quem barra de verdade é a API.
- Cores só por tokens CSS (`var(--...)`), com tema claro e escuro.
- `data-cy` nos elementos usados pelo Cypress; textos em português do Brasil.
- `// @requisito <ID>` na primeira linha dos arquivos que implementam requisitos.
