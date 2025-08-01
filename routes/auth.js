const express = require("express");
const path = require("path");
const { redirectIfAuthenticated } = require("../middleware/auth");
const { User } = require("../models");

const router = express.Router();

// Rota para exibir página de login
router.get("/login", redirectIfAuthenticated, (req, res) => {
  res.render("login", {
    title: "Login - Sistema de Autenticação",
    error: req.session.error || null,
    success: req.session.success || null,
  });

  // Limpar mensagens após exibição
  delete req.session.error;
  delete req.session.success;
});

// Rota para processar login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      req.session.error = "Por favor, preencha todos os campos";
      return res.redirect("/auth/login");
    }

    // Procurar usuário por username ou email
    const user = await User.findByLogin(username);

    if (!user) {
      req.session.error = "Usuário não encontrado";
      return res.redirect("/auth/login");
    }

    // Verificar senha
    const isValidPassword = await user.validatePassword(password);

    if (!isValidPassword) {
      req.session.error = "Senha incorreta";
      return res.redirect("/auth/login");
    }

    // Login bem-sucedido
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Erro no login:", error);
    req.session.error = "Erro interno do servidor";
    res.redirect("/auth/login");
  }
});

// Rota para exibir página de registro
router.get("/register", redirectIfAuthenticated, (req, res) => {
  res.render("register", {
    title: "Registro - Sistema de Autenticação",
    error: req.session.error || null,
    success: req.session.success || null,
  });

  // Limpar mensagens após exibição
  delete req.session.error;
  delete req.session.success;
});

// Rota para processar registro
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validações básicas
    if (!username || !email || !password || !confirmPassword) {
      req.session.error = "Por favor, preencha todos os campos";
      return res.redirect("/auth/register");
    }

    if (password !== confirmPassword) {
      req.session.error = "As senhas não coincidem";
      return res.redirect("/auth/register");
    }

    if (password.length < 6) {
      req.session.error = "A senha deve ter pelo menos 6 caracteres";
      return res.redirect("/auth/register");
    }

    if (username.length < 3 || username.length > 30) {
      req.session.error = "O nome de usuário deve ter entre 3 e 30 caracteres";
      return res.redirect("/auth/register");
    }

    // Verificar se usuário já existe
    const existingUser =
      (await User.findByLogin(username)) || (await User.findByLogin(email));

    if (existingUser) {
      req.session.error = "Usuário ou email já existe";
      return res.redirect("/auth/register");
    }

    // Criar novo usuário
    await User.create({
      username,
      email,
      password, // A senha será automaticamente hasheada pelo hook do modelo
    });

    req.session.success =
      "Conta criada com sucesso! Faça login para continuar.";
    res.redirect("/auth/login");
  } catch (error) {
    console.error("Erro no registro:", error);

    // Tratar erros de validação do Sequelize
    if (error.name === "SequelizeValidationError") {
      const errorMessage = error.errors.map((err) => err.message).join(", ");
      req.session.error = `Erro de validação: ${errorMessage}`;
    } else if (error.name === "SequelizeUniqueConstraintError") {
      req.session.error = "Usuário ou email já existe";
    } else {
      req.session.error = "Erro interno do servidor";
    }

    res.redirect("/auth/register");
  }
});

// Rota para logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao fazer logout:", err);
    }
    res.redirect("/auth/login");
  });
});

// Rota GET para logout (para conveniência)
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao fazer logout:", err);
    }
    res.redirect("/auth/login");
  });
});

module.exports = router;
