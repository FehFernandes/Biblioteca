const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { User, Book, Author, Loan } = require("../models");

const router = express.Router();

// Aplicar middleware de autenticação a todas as rotas do dashboard
router.use(requireAuth);

// Rota principal do dashboard
router.get("/", async (req, res) => {
  try {
    // Buscar estatísticas do sistema
    const [totalBooks, totalAuthors, totalUsers, activeLoans] =
      await Promise.all([
        Book.count(),
        Author.count(),
        User.count(),
        Loan.count({ where: { returnedAt: null } }),
      ]);

    const stats = {
      totalBooks,
      totalAuthors,
      totalUsers,
      activeLoans,
    };

    res.render("dashboard", {
      title: "Dashboard",
      user: req.session.user,
      stats,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.render("dashboard", {
      title: "Dashboard",
      user: req.session.user,
      stats: {
        totalBooks: 0,
        totalAuthors: 0,
        totalUsers: 0,
        activeLoans: 0,
      },
    });
  }
});

// Rota para perfil do usuário
router.get("/profile", async (req, res) => {
  try {
    // Buscar estatísticas do usuário atual
    const userId = req.session.user.id;
    const [totalLoans, activeLoans, overdueLoans] = await Promise.all([
      Loan.count({ where: { userId } }),
      Loan.count({ where: { userId, returnedAt: null } }),
      Loan.count({
        where: {
          userId,
          returnedAt: null,
          dueDate: { [require("sequelize").Op.lt]: new Date() },
        },
      }),
    ]);

    const userStats = {
      totalLoans,
      activeLoans,
      overdueLoans,
    };

    res.render("profile", {
      title: "Meu Perfil",
      user: req.session.user,
      userStats,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas do usuário:", error);
    res.render("profile", {
      title: "Meu Perfil",
      user: req.session.user,
    });
  }
});

module.exports = router;
