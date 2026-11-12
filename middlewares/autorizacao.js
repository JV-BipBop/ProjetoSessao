// ETAPA 3 DA AULA: substituir os next() pelas verificações de segurança.

function compartilharUsuario(req, res, next) {
  // Compartilha o usuário autenticado com as views para controlar a navegação.
  res.locals.usuario = req.session?.usuario || null;
  next();
}

function exigirAutenticacao(req, res, next) {
  // Sem usuário na sessão, impede o acesso e encaminha o visitante ao login.
  if (!req.session?.usuario) {
    return res.redirect("/login");
  }
  next();
}

function exigirPerfil(perfilPermitido) {
  return (req, res, next) => {
    // Impede o acesso quando o perfil da sessão não corresponde ao perfil exigido.
    if (req.session?.usuario?.perfil !== perfilPermitido) {
      return res.status(403).send("Acesso negado.");
    }
    next();
  };
}

module.exports = { compartilharUsuario, exigirAutenticacao, exigirPerfil };
