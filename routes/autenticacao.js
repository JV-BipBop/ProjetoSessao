const express = require("express");
const bcrypt = require("bcryptjs");
const { Usuario } = require("../models");
const router = express.Router();

router.get("/login", (req, res) => {
  res.render("login", { titulo: "Entrar", mensagem: req.query.mensagem });
});

// Valida as credenciais, cria uma nova sessão segura para o usuário e o encaminha ao painel.
router.post("/login", async (req, res, next) => {
  try {
    // ETAPA 2 DA AULA
    const email = typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
    const usuario = email
      ? await Usuario.findOne({ where: { email } })
      : null;

    const senha = typeof req.body.senha === "string" ? req.body.senha : "";
    const credenciaisValidas = usuario?.ativo && senha
      ? await bcrypt.compare(senha, usuario.senhaHash)
      : false;

    if (!credenciaisValidas) {
      return res.status(401).render("login", {
        titulo: "Entrar",
        erro: "E-mail ou senha inválidos.",
        email
      });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((erro) => {
        if (erro) return reject(erro);
        return resolve();
      });
    });

    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      ehAdministrador: usuario.perfil === "administrador"
    };

    return res.redirect("/painel");
  } catch (erro) {
    return next(erro);
  }
});

// Encerra a sessão autenticada somente por POST e remove o cookie do navegador.
router.post("/logout", (req, res, next) => {
  req.session.destroy((erro) => {
    if (erro) return next(erro);
    res.clearCookie("connect.sid", { path: "/" });
    return res.redirect("/login?mensagem=Logout+realizado");
  });
});

module.exports = router;
