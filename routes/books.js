const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { Book, Author, Loan } = require("../models");

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(requireAuth);

// Listar todos os livros
router.get("/", async (req, res) => {
  try {
    const books = await Book.findAll({
      include: [{ model: Author, as: "author" }],
      order: [["title", "ASC"]],
    });

    res.render("books/list", {
      title: "Livros - Sistema Biblioteca",
      books,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao listar livros:", error);
    req.session.error = "Erro ao carregar livros";
    res.redirect("/dashboard");
  }
});

// Exibir formulário de cadastro de livro
router.get("/new", async (req, res) => {
  try {
    const authors = await Author.findAll({ order: [["name", "ASC"]] });

    res.render("books/form", {
      title: "Cadastrar Livro - Sistema Biblioteca",
      authors,
      user: req.session.user,
      book: {},
      action: "/books",
      method: "POST",
    });
  } catch (error) {
    console.error("Erro ao carregar formulário:", error);
    req.session.error = "Erro ao carregar formulário";
    res.redirect("/books");
  }
});

// Cadastrar novo livro
router.post("/", async (req, res) => {
  try {
    const {
      title,
      isbn,
      publishedYear,
      genre,
      pages,
      publisher,
      description,
      quantity,
      authorId,
    } = req.body;

    // Validações básicas
    if (!title || !authorId) {
      req.session.error = "Título e autor são obrigatórios";
      return res.redirect("/books/new");
    }

    await Book.create({
      title,
      isbn: isbn || null,
      publishedYear: publishedYear || null,
      genre: genre || null,
      pages: pages || null,
      publisher: publisher || null,
      description: description || null,
      quantity: quantity || 1,
      available: quantity || 1,
      authorId,
    });

    req.session.success = "Livro cadastrado com sucesso!";
    res.redirect("/books");
  } catch (error) {
    console.error("Erro ao cadastrar livro:", error);

    if (error.name === "SequelizeValidationError") {
      req.session.error = error.errors.map((err) => err.message).join(", ");
    } else if (error.name === "SequelizeUniqueConstraintError") {
      req.session.error = "ISBN já existe no sistema";
    } else {
      req.session.error = "Erro ao cadastrar livro";
    }

    res.redirect("/books/new");
  }
});

// Exibir detalhes de um livro
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: Author, as: "author" }],
    });

    if (!book) {
      req.session.error = "Livro não encontrado";
      return res.redirect("/books");
    }

    res.render("books/detail", {
      title: `${book.title} - Sistema Biblioteca`,
      book,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao carregar livro:", error);
    req.session.error = "Erro ao carregar livro";
    res.redirect("/books");
  }
});

// Exibir formulário de edição
router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    const authors = await Author.findAll({ order: [["name", "ASC"]] });

    if (!book) {
      req.session.error = "Livro não encontrado";
      return res.redirect("/books");
    }

    res.render("books/form", {
      title: "Editar Livro - Sistema Biblioteca",
      authors,
      user: req.session.user,
      book,
      action: `/books/${book.id}`,
      method: "POST",
    });
  } catch (error) {
    console.error("Erro ao carregar formulário de edição:", error);
    req.session.error = "Erro ao carregar formulário";
    res.redirect("/books");
  }
});

// Atualizar livro
router.post("/:id", async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      req.session.error = "Livro não encontrado";
      return res.redirect("/books");
    }

    const {
      title,
      isbn,
      publishedYear,
      genre,
      pages,
      publisher,
      description,
      quantity,
      authorId,
    } = req.body;

    await book.update({
      title,
      isbn: isbn || null,
      publishedYear: publishedYear || null,
      genre: genre || null,
      pages: pages || null,
      publisher: publisher || null,
      description: description || null,
      quantity: quantity || 1,
      authorId,
    });

    req.session.success = "Livro atualizado com sucesso!";
    res.redirect(`/books/${book.id}`);
  } catch (error) {
    console.error("Erro ao atualizar livro:", error);

    if (error.name === "SequelizeValidationError") {
      req.session.error = error.errors.map((err) => err.message).join(", ");
    } else {
      req.session.error = "Erro ao atualizar livro";
    }

    res.redirect(`/books/${req.params.id}/edit`);
  }
});

// Excluir livro
router.post("/:id/delete", async (req, res) => {
  console.log(
    "🔍 DEBUG: Rota de exclusão de livro chamada, ID:",
    req.params.id
  );
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: Loan, as: "loans" }],
    });

    console.log(
      "🔍 DEBUG: Livro encontrado:",
      book ? book.title : "Não encontrado"
    );

    if (!book) {
      req.session.error = "Livro não encontrado";
      return res.redirect("/books");
    }

    // Verificar se há empréstimos ativos
    const activeLoans = book.loans.filter((loan) => !loan.returnedAt);
    console.log("🔍 DEBUG: Empréstimos ativos:", activeLoans.length);

    if (activeLoans.length > 0) {
      req.session.error = "Não é possível excluir livro com empréstimos ativos";
      return res.redirect(`/books/${book.id}`);
    }

    await book.destroy();
    console.log("🔍 DEBUG: Livro excluído com sucesso");
    req.session.success = "Livro excluído com sucesso!";
    res.redirect("/books");
  } catch (error) {
    console.error("Erro ao excluir livro:", error);
    req.session.error = "Erro ao excluir livro";
    res.redirect(`/books/${req.params.id}`);
  }
});

module.exports = router;
