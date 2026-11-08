// Captura prints das telas em 360/768/1280 px com a API simulada (sem backend).
// Uso: node capturar.mjs <pasta-saida> [baseUrl]
import puppeteer from "puppeteer-core";
import fs from "node:fs";
import path from "node:path";

const saida = process.argv[2];
const base = process.argv[3] || "http://localhost:5174";
fs.mkdirSync(saida, { recursive: true });

const hoje = new Date();
const iso = hoje.toISOString().slice(0, 10);
const API = {
  "/api/v1/lojas": [
    {
      id: 1,
      nome: "Studio Centro",
      cnpj: "11222333000181",
      email: "centro@studio.com",
      celular: "32999990000",
      cidade: "Juiz de Fora",
      estado: "MG",
      bairro: "Centro",
      logradouro: "Av. Rio Branco",
      numero: "100",
      cep: "36010000",
    },
    {
      id: 2,
      nome: "Studio Zona Sul",
      cnpj: "11444777000161",
      email: "sul@studio.com",
      celular: "32988880000",
      cidade: "Juiz de Fora",
      estado: "MG",
      bairro: "Cascatinha",
      logradouro: "Rua Ipiranga",
      numero: "45",
      cep: "36033000",
    },
  ],
  "/api/v1/funcionarios": [
    {
      id: 1,
      nome: "Ana",
      sobrenome: "Lima",
      email: "ana@studio.com",
      celular: "32999991111",
      cpf: "52998224725",
      nomeLoja: "Studio Centro",
      area: [{ id: 1, nome: "Cabelo" }],
    },
    {
      id: 2,
      nome: "Bruno",
      sobrenome: "Reis",
      email: "bruno@studio.com",
      celular: "32999992222",
      cpf: "11144477735",
      nomeLoja: "Studio Centro",
      area: [],
    },
    {
      id: 3,
      nome: "Carla",
      sobrenome: "Dias",
      email: "carla@studio.com",
      celular: "32999993333",
      cpf: "93541134780",
      nomeLoja: "Studio Zona Sul",
      area: [],
    },
  ],
  "/api/v1/clientes": [
    {
      id: 1,
      nome: "Mariana",
      sobreNome: "Souza",
      cpf: "52998224725",
      email: "mari@email.com",
      celular: "32991112222",
      dtaNascimento: "1994-03-12",
      nomeLoja: "Studio Centro",
    },
    {
      id: 2,
      nome: "Diego",
      sobreNome: "Alves",
      cpf: "11144477735",
      email: "diego@email.com",
      celular: "32993334444",
      dtaNascimento: "1988-11-02",
      nomeLoja: "Studio Zona Sul",
    },
  ],
  "/api/v1/servicos": [
    {
      id: 1,
      nome: "Corte feminino",
      preco: 80,
      comissaoLoja: 30,
      nomeLoja: "Studio Centro",
      nomeArea: "Cabelo",
    },
  ],
  "/api/v1/AreasAtuacoes": [
    { id: 1, nome: "Cabelo", descricao: "Cortes e coloração", nomeLoja: "Studio Centro" },
  ],
  "/api/v1/cobrancistas": [
    {
      id: 1,
      nome: "Paula Costa",
      email: "paula@cobra.com",
      celular: "32995556666",
      nomeLoja: "Studio Centro",
    },
  ],
  "/api/v1/usuarios": [{ id: 1, nome: "Victor", sobrenome: "Barbosa", email: "victor@studio.com" }],
  "/api/v1/equipes": [
    {
      id: "3f2a-9c1e",
      usuario: { id: 1, nome: "Victor", sobrenome: "Barbosa" },
      loja: { id: 1, nome: "Studio Centro" },
    },
  ],
  "/api/v1/agendamentos": [
    {
      id: 10,
      data: iso,
      horarioInicio: "09:00:00",
      horarioFim: "10:30:00",
      nomeFuncionario: "Ana",
      nomeCliente: "Mariana Souza",
      nomeServico: "Corte feminino",
      cor: "#facc15",
    },
    {
      id: 11,
      data: iso,
      horarioInicio: "11:00:00",
      horarioFim: "12:00:00",
      nomeFuncionario: "Bruno",
      nomeCliente: "Diego Alves",
      nomeServico: "Barba",
      cor: null,
    },
    {
      id: 12,
      data: iso,
      horarioInicio: "14:00:00",
      horarioFim: "15:00:00",
      nomeFuncionario: "Carla",
      nomeCliente: "Lia Prado",
      nomeServico: "Escova",
      cor: "#2563eb",
    },
  ],
};

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = `${b64({ alg: "HS256" })}.${b64({ sub: "print", exp: Math.floor(Date.now() / 1000) + 3600 })}.assinatura`;

const TELAS = [
  { nome: "login", rota: "/login", logado: false },
  { nome: "cadastro-conta", rota: "/register", logado: false },
  { nome: "cadastro-loja", rota: "/cadastro-loja", logado: true },
  { nome: "cadastro-funcionario", rota: "/cadastro-funcionario", logado: true },
  { nome: "listagem-clientes", rota: "/listagem-clientes", logado: true },
  { nome: "listagem-equipes", rota: "/listagem-equipes", logado: true },
  { nome: "agenda", rota: "/agenda", logado: true },
];
const LARGURAS = [360, 768, 1280];
const TEMAS = (process.env.TEMAS || "light").split(",");

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-first-run", "--disable-extensions"],
});

for (const tema of TEMAS) {
  for (const tela of TELAS) {
    for (const largura of LARGURAS) {
      const page = await browser.newPage();
      await page.setViewport({
        width: largura,
        height: largura < 768 ? 780 : 860,
        deviceScaleFactor: 1,
      });
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const u = new URL(req.url());
        if (u.pathname.startsWith("/api/v1/")) {
          const corpo = API[u.pathname];
          return req.respond({
            status: corpo ? 200 : 404,
            contentType: "application/json",
            body: JSON.stringify(corpo ?? { message: "não simulado" }),
          });
        }
        req.continue();
      });
      await page.evaluateOnNewDocument(
        (logado, token, tema) => {
          localStorage.clear();
          localStorage.setItem("web_app_tema", tema);
          if (logado) {
            localStorage.setItem("token", token);
            localStorage.setItem("usuario", JSON.stringify({ id: 1, nome: "Victor" }));
          }
        },
        tela.logado,
        token,
        tema,
      );
      await page.goto(base + tela.rota, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 900)); // hidratação + animações de entrada
      if (tela.nome === "agenda") {
        await page.evaluate(() => {
          const g = document.querySelector(".agenda-grid-container");
          if (g) g.scrollTop = 8 * 60;
        });
      }
      const arquivo = path.join(
        saida,
        `${tela.nome}-${largura}${tema === "dark" ? "-escuro" : ""}.png`,
      );
      await page.screenshot({ path: arquivo, fullPage: tela.nome !== "agenda" });
      console.log("ok", arquivo);
      await page.close();
    }
  }
}
await browser.close();
