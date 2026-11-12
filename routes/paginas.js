const express = require("express");
const { Usuario } = require("../models");
const { exigirAutenticacao, exigirPerfil } = require("../middlewares/autorizacao");

const router = express.Router();

router.get("/", (req, res) => res.redirect("/login"));

// Exibe o painel usando os dados da sessão, somente após exigir autenticação.
router.get("/painel", exigirAutenticacao, (req, res) => {
  res.render("painel", { titulo: "Painel", usuario: req.session.usuario });
});

router.get(
  "/administracao",
  exigirAutenticacao,
  exigirPerfil("administrador"),
  async (req, res, next) => {
    try {
      const usuarios = await Usuario.findAll({
        attributes: ["id", "nome", "email", "perfil", "ativo"],
        order: [["nome", "ASC"]],
        raw: true
      });
      res.render("administracao", { titulo: "Administração", usuarios });
    } catch (erro) {
      next(erro);
    }
  }
);

router.get("/saude", (req, res) => res.json({ status: "ok" }));

module.exports = router;
