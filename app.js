const path = require("node:path");
const { randomBytes } = require("node:crypto");
const express = require("express");
const { engine } = require("express-handlebars");
const session = require("express-session");

const autenticacaoRouter = require("./routes/autenticacao");
const paginasRouter = require("./routes/paginas");
const { compartilharUsuario } = require("./middlewares/autorizacao");

const sessionSecret = process.env.SESSION_SECRET ||
  randomBytes(32).toString("hex");

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET não definida; sessões serão invalidadas ao reiniciar o servidor.");
}

function createApp() {
  const app = express();

  app.engine("hbs", engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views", "layouts"),
    partialsDir: path.join(__dirname, "views", "partials")
  }));
  app.set("view engine", "hbs");
  app.set("views", path.join(__dirname, "views"));

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "public")));

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 1000
    }
  }));

  app.use(compartilharUsuario);
  app.use(autenticacaoRouter);
  app.use(paginasRouter);

  app.use((req, res) => res.status(404).send("Página não encontrada."));
  app.use((erro, req, res, next) => {
    console.error(erro);
    if (res.headersSent) return next(erro);
    return res.status(500).send("Falha inesperada.");
  });

  return app;
}

module.exports = { createApp };
