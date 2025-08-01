const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { Author, Book } = require("../models");

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(requireAuth);

// Listar todos os autores
router.get("/", async (req, res) => {
  try {
    const authors = await Author.findAll({
      include: [{ model: Book, as: "books" }],
      order: [["name", "ASC"]],
    });

    res.render("authors/list", {
      title: "Autores - Sistema Biblioteca",
      authors,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao listar autores:", error);
    req.session.error = "Erro ao carregar autores";
    res.redirect("/dashboard");
  }
});

// Exibir formulário de cadastro de autor
router.get("/new", (req, res) => {
  res.render("authors/form", {
    title: "Cadastrar Autor - Sistema Biblioteca",
    user: req.session.user,
    author: {},
    action: "/authors",
    method: "POST",
  });
});

// Cadastrar novo autor
router.post("/", async (req, res) => {
  try {
    const { name, biography, birthDate, nationality } = req.body;

    // Validações básicas
    if (!name) {
      req.session.error = "Nome é obrigatório";
      return res.redirect("/authors/new");
    }

    await Author.create({
      name,
      biography: biography || null,
      birthDate: birthDate || null,
      nationality: nationality || null,
    });

    req.session.success = "Autor cadastrado com sucesso!";
    res.redirect("/authors");
  } catch (error) {
    console.error("Erro ao cadastrar autor:", error);

    if (error.name === "SequelizeValidationError") {
      req.session.error = error.errors.map((err) => err.message).join(", ");
    } else {
      req.session.error = "Erro ao cadastrar autor";
    }

    res.redirect("/authors/new");
  }
});

// Exibir detalhes de um autor
router.get("/:id", async (req, res) => {
  try {
    const author = await Author.findByPk(req.params.id, {
      include: [{ model: Book, as: "books" }],
    });

    if (!author) {
      req.session.error = "Autor não encontrado";
      return res.redirect("/authors");
    }

    res.render("authors/detail", {
      title: `${author.name} - Sistema Biblioteca`,
      author,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao carregar autor:", error);
    req.session.error = "Erro ao carregar autor";
    res.redirect("/authors");
  }
});

// Exibir formulário de edição
router.get("/:id/edit", async (req, res) => {
  try {
    const author = await Author.findByPk(req.params.id);

    if (!author) {
      req.session.error = "Autor não encontrado";
      return res.redirect("/authors");
    }

    res.render("authors/form", {
      title: "Editar Autor - Sistema Biblioteca",
      user: req.session.user,
      author,
      action: `/authors/${author.id}`,
      method: "POST",
    });
  } catch (error) {
    console.error("Erro ao carregar formulário de edição:", error);
    req.session.error = "Erro ao carregar formulário";
    res.redirect("/authors");
  }
});

// Atualizar autor
router.post("/:id", async (req, res) => {
  try {
    const author = await Author.findByPk(req.params.id);

    if (!author) {
      req.session.error = "Autor não encontrado";
      return res.redirect("/authors");
    }

    const { name, biography, birthDate, nationality } = req.body;

    await author.update({
      name,
      biography: biography || null,
      birthDate: birthDate || null,
      nationality: nationality || null,
    });

    req.session.success = "Autor atualizado com sucesso!";
    res.redirect(`/authors/${author.id}`);
  } catch (error) {
    console.error("Erro ao atualizar autor:", error);

    if (error.name === "SequelizeValidationError") {
      req.session.error = error.errors.map((err) => err.message).join(", ");
    } else {
      req.session.error = "Erro ao atualizar autor";
    }

    res.redirect(`/authors/${req.params.id}/edit`);
  }
});

// Excluir autor
router.post("/:id/delete", async (req, res) => {
  console.log(
    "🔍 DEBUG: Rota de exclusão de autor chamada, ID:",
    req.params.id
  );
  try {
    const author = await Author.findByPk(req.params.id, {
      include: [{ model: Book, as: "books" }],
    });

    console.log(
      "🔍 DEBUG: Autor encontrado:",
      author ? author.name : "Não encontrado"
    );

    if (!author) {
      req.session.error = "Autor não encontrado";
      return res.redirect("/authors");
    }

    // Verificar se há livros cadastrados para este autor
    console.log("🔍 DEBUG: Livros do autor:", author.books.length);
    if (author.books.length > 0) {
      req.session.error =
        "Não é possível excluir autor que possui livros cadastrados";
      return res.redirect(`/authors/${author.id}`);
    }

    await author.destroy();
    console.log("🔍 DEBUG: Autor excluído com sucesso");
    req.session.success = "Autor excluído com sucesso!";
    res.redirect("/authors");
  } catch (error) {
    console.error("Erro ao excluir autor:", error);
    req.session.error = "Erro ao excluir autor";
    res.redirect(`/authors/${req.params.id}`);
  }
});

module.exports = router;
