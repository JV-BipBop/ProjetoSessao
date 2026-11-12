process.env.DATABASE_STORAGE = ":memory:";
const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const bcrypt = require("bcryptjs");
const { createApp } = require("../app");
const { sequelize, Usuario } = require("../models");

test.before(async () => {
  await sequelize.sync({ force: true });
  await Usuario.bulkCreate([
    { nome: "Estudante Demo", email: "estudante@escola.test", senhaHash: await bcrypt.hash("aluno123", 4), perfil: "estudante", ativo: true },
    { nome: "Administrador Demo", email: "admin@escola.test", senhaHash: await bcrypt.hash("admin123", 4), perfil: "administrador", ativo: true }
  ]);
});
test.after(() => sequelize.close());

test("GET /login apresenta o formulário", async () => {
  const resposta = await request(createApp()).get("/login");
  assert.equal(resposta.status, 200);
  assert.match(resposta.text, /Entrar no Portal Acadêmico/);
  // Visitantes veem somente o link de login, sem navegação para áreas restritas.
  assert.match(resposta.text, /href="\/login">Login<\/a>/);
  assert.doesNotMatch(resposta.text, /href="\/administracao">Administração<\/a>/);
});
test("GET /saude responde em JSON", async () => {
  const resposta = await request(createApp()).get("/saude");
  assert.equal(resposta.status, 200);
  assert.deepEqual(resposta.body, { status: "ok" });
});
// Verifica as respostas de login inválido e que o login válido mantém a sessão entre requisições.
test("credenciais inválidas retornam 401 com mensagem genérica", async () => {
  const app = createApp();
  const senhaIncorreta = await request(app)
    .post("/login")
    .type("form")
    .send({ email: "estudante@escola.test", senha: "incorreta" });
  const usuarioInexistente = await request(app)
    .post("/login")
    .type("form")
    .send({ email: "inexistente@escola.test", senha: "incorreta" });

  assert.equal(senhaIncorreta.status, 401);
  assert.equal(usuarioInexistente.status, 401);
  assert.match(senhaIncorreta.text, /E-mail ou senha inválidos/);
  assert.match(usuarioInexistente.text, /E-mail ou senha inválidos/);
});
test("login válido regenera a sessão e leva o usuário ao painel", async () => {
  const app = createApp();
  const agente = request.agent(app);
  const respostaLogin = await agente
    .post("/login")
    .type("form")
    .send({ email: "estudante@escola.test", senha: "aluno123" });
  const respostaPainel = await agente.get("/painel");

  assert.equal(respostaLogin.status, 302);
  assert.equal(respostaLogin.headers.location, "/painel");
  assert.equal(respostaPainel.status, 200);
  assert.match(respostaPainel.text, /Olá, Estudante Demo!/);
  // Estudantes autenticados não veem links de login nem de administração.
  assert.match(respostaPainel.text, /href="\/painel">Painel<\/a>/);
  assert.doesNotMatch(respostaPainel.text, /href="\/administracao">Administração<\/a>/);
  assert.doesNotMatch(respostaPainel.text, /href="\/login">Login<\/a>/);
});
// Confirma que um visitante sem sessão é redirecionado ao login ao tentar abrir o painel.
test("visitante é redirecionado ao tentar abrir o painel", async () => {
  const resposta = await request(createApp()).get("/painel");
  assert.equal(resposta.status, 302);
  assert.equal(resposta.headers.location, "/login");
});

// Confirma que apenas uma sessão com perfil de administrador abre a área administrativa.
test("estudante recebe 403 ao tentar abrir a administração", async () => {
  const agente = request.agent(createApp());
  await agente
    .post("/login")
    .type("form")
    .send({ email: "estudante@escola.test", senha: "aluno123" });

  const resposta = await agente.get("/administracao");
  assert.equal(resposta.status, 403);
  assert.equal(resposta.text, "Acesso negado.");
});
test("administrador pode abrir a administração", async () => {
  const agente = request.agent(createApp());
  await agente
    .post("/login")
    .type("form")
    .send({ email: "admin@escola.test", senha: "admin123" });

  const resposta = await agente.get("/administracao");
  assert.equal(resposta.status, 200);
  assert.match(resposta.text, /Administração/);
  // Administradores autenticados recebem o link para a área administrativa.
  assert.match(resposta.text, /href="\/administracao">Administração<\/a>/);
});
// Confirma que o logout por POST invalida a sessão e impede novo acesso ao painel.
test("logout encerra a sessão por POST", async () => {
  const agente = request.agent(createApp());
  await agente
    .post("/login")
    .type("form")
    .send({ email: "estudante@escola.test", senha: "aluno123" });

  const respostaLogout = await agente.post("/logout");
  const respostaPainel = await agente.get("/painel");

  assert.equal(respostaLogout.status, 302);
  assert.equal(respostaLogout.headers.location, "/login?mensagem=Logout+realizado");
  assert.match(respostaLogout.headers["set-cookie"][0], /^connect\.sid=;/);
  assert.equal(respostaPainel.status, 302);
  assert.equal(respostaPainel.headers.location, "/login");
});
