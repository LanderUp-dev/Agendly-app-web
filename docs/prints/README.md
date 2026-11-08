# Prints: antes e depois do redesign

As capturas usam as mesmas telas, larguras (360, 768 e 1280 px), temas (claro e escuro) e dados simulados
de API, para comparar só a interface. Para gerar de novo, com o `npm run dev` rodando na porta 5174:

```bash
node scripts/capturar-prints.mjs docs/prints/depois
```

O script usa o `puppeteer-core`, que não está nas dependências do projeto (`npm i -D puppeteer-core`), e o Chrome instalado.

Arquivos: `<tela>-<largura>[-escuro].png`.

| Tela | Antes (1280) | Depois (1280) | Mobile antes (360) | Mobile depois (360) |
|---|---|---|---|---|
| Login | [antes](antes/login-1280.png) | [depois](depois/login-1280.png) | [antes](antes/login-360.png) | [depois](depois/login-360.png) |
| Cadastro de conta | [antes](antes/cadastro-conta-1280.png) | [depois](depois/cadastro-conta-1280.png) | [antes](antes/cadastro-conta-360.png) | [depois](depois/cadastro-conta-360.png) |
| Cadastro de loja | [antes](antes/cadastro-loja-1280.png) | [depois](depois/cadastro-loja-1280.png) | [antes](antes/cadastro-loja-360.png) | [depois](depois/cadastro-loja-360.png) |
| Cadastro de funcionário | [antes](antes/cadastro-funcionario-1280.png) | [depois](depois/cadastro-funcionario-1280.png) | [antes](antes/cadastro-funcionario-360.png) | [depois](depois/cadastro-funcionario-360.png) |
| Listagem de clientes | [antes](antes/listagem-clientes-1280.png) | [depois](depois/listagem-clientes-1280.png) | [antes](antes/listagem-clientes-360.png) | [depois](depois/listagem-clientes-360.png) |
| Listagem de equipes | [antes](antes/listagem-equipes-1280.png) | [depois](depois/listagem-equipes-1280.png) | [antes](antes/listagem-equipes-360.png) | [depois](depois/listagem-equipes-360.png) |
| Agenda | [antes](antes/agenda-1280.png) | [depois](depois/agenda-1280.png) | [antes](antes/agenda-360.png) | [depois](depois/agenda-360.png) |

As versões em 768 px e no tema escuro seguem o mesmo padrão de nome (ex.: `depois/agenda-768-escuro.png`).
