const { sequelize } = require("../config/database");
const User = require("./User");
const Author = require("./Author");
const Book = require("./Book");
const Loan = require("./Loan");

// Definir associações
// Um autor pode ter muitos livros
Author.hasMany(Book, { foreignKey: "authorId", as: "books" });
Book.belongsTo(Author, { foreignKey: "authorId", as: "author" });

// Um usuário pode ter muitos empréstimos
User.hasMany(Loan, { foreignKey: "userId", as: "loans" });
Loan.belongsTo(User, { foreignKey: "userId", as: "user" });

// Um livro pode ter muitos empréstimos
Book.hasMany(Loan, { foreignKey: "bookId", as: "loans" });
Loan.belongsTo(Book, { foreignKey: "bookId", as: "book" });

// Sincronizar modelos com o banco de dados
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ Modelos sincronizados com o banco de dados!");
  } catch (error) {
    console.error("❌ Erro ao sincronizar modelos:", error);
  }
}

module.exports = {
  sequelize,
  User,
  Author,
  Book,
  Loan,
  syncDatabase,
};
