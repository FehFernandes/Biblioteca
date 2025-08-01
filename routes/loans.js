const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { Loan, User, Book, Author } = require("../models");
const { Op } = require("sequelize");

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas
router.use(requireAuth);

// Listar todos os empréstimos
router.get("/", async (req, res) => {
  try {
    const loans = await Loan.findAll({
      include: [
        { model: User, as: "user" },
        {
          model: Book,
          as: "book",
          include: [{ model: Author, as: "author" }],
        },
      ],
      order: [["loanDate", "DESC"]],
    });

    res.render("loans/list", {
      title: "Empréstimos - Sistema Biblioteca",
      loans,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao listar empréstimos:", error);
    req.session.error = "Erro ao carregar empréstimos";
    res.redirect("/dashboard");
  }
});

// Exibir formulário de novo empréstimo
router.get("/new", async (req, res) => {
  try {
    const users = await User.findAll({ order: [["username", "ASC"]] });
    const books = await Book.findAll({
      where: { available: { [Op.gt]: 0 } },
      include: [{ model: Author, as: "author" }],
      order: [["title", "ASC"]],
    });

    res.render("loans/form", {
      title: "Novo Empréstimo - Sistema Biblioteca",
      users,
      books,
      user: req.session.user,
      loan: {},
      action: "/loans",
      method: "POST",
    });
  } catch (error) {
    console.error("Erro ao carregar formulário:", error);
    req.session.error = "Erro ao carregar formulário";
    res.redirect("/loans");
  }
});

// Criar novo empréstimo
router.post("/", async (req, res) => {
  try {
    const { userId, bookId, notes } = req.body;

    // Validações básicas
    if (!userId || !bookId) {
      req.session.error = "Usuário e livro são obrigatórios";
      return res.redirect("/loans/new");
    }

    // Verificar se o livro está disponível
    const book = await Book.findByPk(bookId);
    if (!book || book.available <= 0) {
      req.session.error = "Livro não disponível para empréstimo";
      return res.redirect("/loans/new");
    }

    // Verificar se o usuário já tem empréstimo ativo deste livro
    const existingLoan = await Loan.findOne({
      where: {
        userId,
        bookId,
        status: "active",
      },
    });

    if (existingLoan) {
      req.session.error = "Usuário já possui empréstimo ativo deste livro";
      return res.redirect("/loans/new");
    }

    // Criar o empréstimo
    const loanDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 dias de prazo

    await Loan.create({
      userId,
      bookId,
      loanDate,
      dueDate,
      notes: notes || null,
    });

    // Diminuir a quantidade disponível do livro
    await book.update({
      available: book.available - 1,
    });

    req.session.success = "Empréstimo realizado com sucesso!";
    res.redirect("/loans");
  } catch (error) {
    console.error("Erro ao criar empréstimo:", error);

    if (error.name === "SequelizeValidationError") {
      req.session.error = error.errors.map((err) => err.message).join(", ");
    } else {
      req.session.error = "Erro ao criar empréstimo";
    }

    res.redirect("/loans/new");
  }
});

// Exibir detalhes de um empréstimo
router.get("/:id", async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: User, as: "user" },
        {
          model: Book,
          as: "book",
          include: [{ model: Author, as: "author" }],
        },
      ],
    });

    if (!loan) {
      req.session.error = "Empréstimo não encontrado";
      return res.redirect("/loans");
    }

    res.render("loans/detail", {
      title: `Empréstimo #${loan.id} - Sistema Biblioteca`,
      loan,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao carregar empréstimo:", error);
    req.session.error = "Erro ao carregar empréstimo";
    res.redirect("/loans");
  }
});

// Devolver livro
router.post("/:id/return", async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [{ model: Book, as: "book" }],
    });

    if (!loan) {
      req.session.error = "Empréstimo não encontrado";
      return res.redirect("/loans");
    }

    if (loan.status !== "active") {
      req.session.error = "Este empréstimo já foi finalizado";
      return res.redirect("/loans");
    }

    // Atualizar empréstimo
    await loan.update({
      returnDate: new Date(),
      status: "returned",
    });

    // Aumentar a quantidade disponível do livro
    await loan.book.update({
      available: loan.book.available + 1,
    });

    req.session.success = "Livro devolvido com sucesso!";
    res.redirect(`/loans/${loan.id}`);
  } catch (error) {
    console.error("Erro ao devolver livro:", error);
    req.session.error = "Erro ao devolver livro";
    res.redirect("/loans");
  }
});

// Listar empréstimos em atraso
router.get("/overdue/list", async (req, res) => {
  try {
    const today = new Date();
    const loans = await Loan.findAll({
      where: {
        status: "active",
        dueDate: { [Op.lt]: today },
      },
      include: [
        { model: User, as: "user" },
        {
          model: Book,
          as: "book",
          include: [{ model: Author, as: "author" }],
        },
      ],
      order: [["dueDate", "ASC"]],
    });

    // Atualizar status para overdue
    for (const loan of loans) {
      if (loan.status === "active") {
        await loan.update({ status: "overdue" });
      }
    }

    res.render("loans/overdue", {
      title: "Empréstimos em Atraso - Sistema Biblioteca",
      loans,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erro ao listar empréstimos em atraso:", error);
    req.session.error = "Erro ao carregar empréstimos em atraso";
    res.redirect("/loans");
  }
});

// Excluir empréstimo
router.post("/:id/delete", async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: Book, as: "book" },
        { model: User, as: "user" },
      ],
    });

    if (!loan) {
      req.session.error = "Empréstimo não encontrado";
      return res.redirect("/loans");
    }

    // Se o empréstimo não foi devolvido, devolver o livro automaticamente
    if (!loan.returnedAt) {
      await loan.book.increment("available", { by: 1 });
    }

    await loan.destroy();
    req.session.success = "Empréstimo excluído com sucesso!";
    res.redirect("/loans");
  } catch (error) {
    console.error("Erro ao excluir empréstimo:", error);
    req.session.error = "Erro ao excluir empréstimo";
    res.redirect(`/loans/${req.params.id}`);
  }
});

module.exports = router;
