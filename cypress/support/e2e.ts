import "cypress-axe";
import { registrarComandos } from "./commands";

// package.json tem "sideEffects": false: um import só de efeito colateral seria descartado
// pelo bundler, então os comandos são registrados por chamada explícita.
registrarComandos();

// Erros de rede esperados (ex.: testes de 500/timeout) não devem derrubar o teste.
Cypress.on("uncaught:exception", (erro) => {
  if (/AxiosError|Network Error|Request failed|timeout/i.test(erro.message)) return false;
  return true;
});
