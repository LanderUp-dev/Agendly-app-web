#!/usr/bin/env node
/**
 * Gera o relatório dos testes E2E:
 *  1. junta os JSON do mochawesome (cypress/reports/json) em cypress/reports/merged.json
 *  2. gera o HTML em cypress/reports/html/index.html
 *  3. escreve docs/relatorio-testes.md (português) com totais, tabela por área,
 *     falhas com causa provável/classificação (cypress/classificacao-falhas.json)
 *     e copia os prints de falha para docs/relatorio-evidencias/.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { merge } from "mochawesome-merge";
import { create as gerarHtml } from "mochawesome-report-generator";

const raiz = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
  "..",
);
const dirReports = path.join(raiz, "cypress", "reports");
const dirJson = path.join(dirReports, "json");
const dirShots = path.join(dirReports, "screenshots");
const dirEvid = path.join(raiz, "docs", "relatorio-evidencias");
const arqMd = path.join(raiz, "docs", "relatorio-testes.md");
const arqClass = path.join(raiz, "cypress", "classificacao-falhas.json");

if (
  !fs.existsSync(dirJson) ||
  fs.readdirSync(dirJson).filter((f) => f.endsWith(".json")).length === 0
) {
  console.error('Nenhum resultado em cypress/reports/json. Rode "npm run cy:run" antes.');
  process.exit(1);
}

const relatorio = await merge({ files: [path.join(dirJson, "*.json").replace(/\\/g, "/")] });
fs.writeFileSync(path.join(dirReports, "merged.json"), JSON.stringify(relatorio, null, 2));
await gerarHtml(relatorio, {
  reportDir: path.join(dirReports, "html"),
  reportFilename: "index",
  reportTitle: "Agendly — Testes E2E",
  reportPageTitle: "Agendly — Testes E2E",
  charts: true,
  inline: true,
});

// ---------------------------------------------------------------- dados
const classificacao = fs.existsSync(arqClass) ? JSON.parse(fs.readFileSync(arqClass, "utf8")) : {};
const AREAS = {
  "01-autenticacao": "Autenticação",
  "02-cadastro-conta": "Cadastro de conta",
  "03-cadastros": "Cadastros",
  "04-listagens": "Listagens",
  "05-agenda": "Agenda",
  "06-carregamento": "Carregamento",
  "07-seguranca": "Segurança",
  "08-acessibilidade": "Acessibilidade",
};

const testes = [];
const percorrer = (suite, arquivo, trilha) => {
  const nome = [...trilha, suite.title].filter(Boolean);
  for (const t of suite.tests ?? []) {
    testes.push({
      arquivo,
      titulo: [...nome, t.title].join(" › "),
      estado: t.state ?? (t.pending ? "pending" : t.skipped ? "skipped" : "unknown"),
      pendente: t.pending || t.skipped,
      duracao: t.duration ?? 0,
      erro: t.err?.message ?? "",
    });
  }
  for (const s of suite.suites ?? []) percorrer(s, arquivo, nome);
};
for (const r of relatorio.results) {
  const arquivo = path.basename(r.file || r.fullFile || "").replace(".cy.ts", "");
  for (const s of r.suites) percorrer(s, arquivo, []);
}

const st = relatorio.stats;
const porArea = {};
for (const t of testes) {
  const area = AREAS[t.arquivo] ?? t.arquivo;
  porArea[area] ??= { total: 0, passou: 0, falhou: 0, pendente: 0 };
  porArea[area].total++;
  if (t.pendente) porArea[area].pendente++;
  else if (t.estado === "passed") porArea[area].passou++;
  else if (t.estado === "failed") porArea[area].falhou++;
}

// Prints de falha -> docs/relatorio-evidencias
fs.mkdirSync(dirEvid, { recursive: true });
const prints = [];
const listar = (d) =>
  fs.existsSync(d)
    ? fs
        .readdirSync(d, { withFileTypes: true })
        .flatMap((e) => (e.isDirectory() ? listar(path.join(d, e.name)) : [path.join(d, e.name)]))
    : [];
for (const p of listar(dirShots).filter((f) => f.endsWith(".png"))) {
  const destino = path.join(dirEvid, path.basename(p).replace(/\s+/g, "_"));
  fs.copyFileSync(p, destino);
  prints.push({ origem: path.basename(p), arquivo: path.basename(destino) });
}

const acharPrint = (titulo) => {
  const pedaco = titulo.split(" › ").pop()?.slice(0, 40) ?? "";
  return prints.find((p) => p.origem.includes(pedaco))?.arquivo;
};

let commit = "sem repositório Git";
try {
  commit = execSync("git rev-parse --short HEAD", {
    cwd: raiz,
    stdio: ["ignore", "pipe", "ignore"],
  })
    .toString()
    .trim();
} catch {
  /* sem git */
}
const versao = (pkg) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(raiz, "node_modules", pkg, "package.json"), "utf8"))
      .version;
  } catch {
    return "?";
  }
};

const fmtTempo = (ms) => `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`;
const falhas = testes.filter((t) => t.estado === "failed");
const pendentes = testes.filter((t) => t.pendente);
const ambiente = process.env.E2E_AMBIENTE || "lab";

// ------------------------------------------------------------ markdown
const linhas = [];
linhas.push("# Relatório de testes E2E — Agendly", "");
linhas.push(
  "> Gerado por `npm run cy:report` a partir dos resultados do Cypress. Não editar à mão:",
  "> classificações e causas ficam em `cypress/classificacao-falhas.json`.",
  "",
);
linhas.push("## Execução", "");
linhas.push("| Item | Valor |", "|---|---|");
linhas.push(`| Data/hora | ${new Date(st.end || Date.now()).toLocaleString("pt-BR")} |`);
linhas.push(`| URL testada | ${process.env.CYPRESS_BASE_URL || "http://localhost:8080"} |`);
linhas.push(`| Ambiente | ${ambiente} |`);
linhas.push(`| Commit | ${commit} |`);
linhas.push(
  `| Versões | Cypress ${versao("cypress")}, Node ${process.version}, axe-core ${versao("axe-core")} |`,
);
linhas.push(`| Duração | ${fmtTempo(st.duration ?? 0)} |`);
linhas.push("");
linhas.push("## Totais", "");
linhas.push("| Specs | Testes | Passou | Falhou | Pendente/ignorado |", "|---|---|---|---|---|");
linhas.push(
  `| ${st.suites !== undefined ? relatorio.results.length : "?"} | ${st.tests} | ${st.passes} | ${st.failures} | ${st.pending + (st.skipped ?? 0)} |`,
);
linhas.push("");
linhas.push("## Por área", "");
linhas.push("| Área | Testes | Passou | Falhou | Pendente |", "|---|---|---|---|---|");
for (const [area, v] of Object.entries(porArea)) {
  linhas.push(`| ${area} | ${v.total} | ${v.passou} | ${v.falhou} | ${v.pendente} |`);
}
linhas.push("");
linhas.push("## Falhas", "");
if (falhas.length === 0) linhas.push("Nenhuma falha.", "");
for (const f of falhas) {
  const c = classificacao[f.titulo] ?? {};
  linhas.push(`### ${f.titulo}`, "");
  linhas.push(`- **Classificação:** ${c.classe ?? "a classificar"}`);
  linhas.push(`- **Causa provável:** ${c.causa ?? "a analisar"}`);
  if (c.passos) linhas.push(`- **Passo a passo:** ${c.passos}`);
  linhas.push(`- **Erro:** \`${f.erro.replace(/\s+/g, " ").slice(0, 400)}\``);
  const print = acharPrint(f.titulo);
  if (print) linhas.push(`- **Evidência:** ![print](relatorio-evidencias/${encodeURI(print)})`);
  linhas.push("");
}
linhas.push("## Pendentes (ignorados com motivo)", "");
if (pendentes.length === 0) linhas.push("Nenhum.", "");
for (const p of pendentes) linhas.push(`- ${p.titulo}`);
linhas.push("");
const extras = classificacao.__relatorio ?? {};
if (extras.observacoes?.length) {
  linhas.push("## Observações do ambiente", "");
  for (const o of extras.observacoes) linhas.push(`- ${o}`);
  linhas.push("");
}
if (extras.recomendacoes?.length) {
  linhas.push("## Recomendações (prioridade)", "");
  extras.recomendacoes.forEach((r, i) => linhas.push(`${i + 1}. ${r}`));
  linhas.push("");
}
linhas.push("---", "", "Relatório HTML completo: `cypress/reports/html/index.html`.", "");
fs.writeFileSync(arqMd, linhas.join("\n"));

console.log(`Relatório: ${path.relative(raiz, arqMd)} | HTML: cypress/reports/html/index.html`);
console.log(
  `Testes: ${st.tests} | passou ${st.passes} | falhou ${st.failures} | pendente ${st.pending}`,
);
