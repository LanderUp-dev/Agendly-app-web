# Lab Docker — Frontend (Agendly-app-web-main)

Este compose sobe o **servidor Node do TanStack Start** e o **Nginx**, que é a única
porta publicada no host. Front e API ficam no mesmo domínio, então não há CORS.

```
navegador ──> nginx:80 (host: HTTP_PORT)
               ├── /api/  → backend:8080   (compose do Agendly-api, mantém /api/v1/...)
               └── /      → frontend:3000
```

## Arquivos

| Arquivo | Para quê |
|---|---|
| `docker-compose.yml` | frontend + nginx, healthchecks, rede externa `agendly-rede` |
| `Dockerfile` | `npm ci` + `vite build` (Nitro `node-server`) + Node 24 |
| `nginx/nginx.conf` | Proxy `/api/` e `/`, headers de segurança, `client_max_body_size 2m` |
| `.env.example` | `HTTP_PORT` e variáveis do Vite |

## Subir (depois do backend)

O backend precisa estar de pé antes, porque é o compose dele que cria a rede `agendly-rede`.

```bash
cd ../Agendly-api && docker compose up -d --build     # se ainda não subiu
cd ../Agendly-app-web-main
cp .env.example .env
docker compose up -d --build
docker compose ps
```

Abra `http://<servidor>:8080` (ou a porta definida em `HTTP_PORT`).

O Nginx resolve o nome `backend` a cada requisição. Se a API cair ou ainda estiver
subindo, `/api/` responde 502, mas o site continua no ar e volta sozinho quando ela subir.

## Antes de ir para produção real

- Colocar TLS no Nginx e então habilitar o HSTS (linha comentada no `nginx.conf`).

## Testes E2E (Cypress)

Rodam contra o lab com **banco de teste** (nunca contra dados reais). Cada execução cria os próprios
dados com sufixo único e CPF/CNPJ válidos; o usuário de teste é criado pela API pública se não existir.

```bash
cp cypress.env.example.json cypress.env.json     # ou exporte as variáveis abaixo
export CYPRESS_USER_EMAIL=e2e@agendly.test
export CYPRESS_USER_PASSWORD='uma-senha-de-teste-123'
npm run test:e2e        # sobe os dois composes, espera, roda e gera o relatório
```

| Script | O que faz |
|---|---|
| `npm run cy:open` | Cypress interativo |
| `npm run cy:run` | Roda todas as specs (headless) |
| `npm run cy:report` | Junta os JSON → `cypress/reports/html/index.html` e `docs/relatorio-testes.md` |
| `npm run test:e2e` | Sobe o lab (`E2E_SUBIR_LAB=0` para pular), espera, roda e gera o relatório |

Variáveis: `CYPRESS_BASE_URL` (padrão `http://localhost:8080`), `CYPRESS_USER_EMAIL`, `CYPRESS_USER_PASSWORD`.
Para um banco só de testes, suba o compose do backend com `POSTGRES_DB=agendly_teste` em outro diretório/projeto
(`docker compose -p agendly-teste ...`) e aponte `CYPRESS_BASE_URL` para o Nginx dele.

**Limpeza:** o backend não tem exclusão em lote; os dados criados (sufixo único, e-mails `@e2e.test`) ficam no
banco de teste. Para zerar: `docker compose -p agendly-teste down -v` no backend (apaga o volume).

## Desenvolvimento local (sem Docker)

```bash
npm install
npm run dev     # Vite com proxy /api -> VITE_API_PROXY_TARGET (padrão http://localhost:8080)
```

## CI/CD e variáveis

Pipeline em `.github/workflows/ci.yml` (tipos, vitest, build, auditoria, imagem). Lista completa
das variáveis e resultados dos testes: `../Agendly-api/docs/ci-cd-e-variaveis.md`.
