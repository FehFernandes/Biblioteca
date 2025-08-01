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

// Função para criar dados de exemplo
async function createSampleData() {
  try {
    // Verificar se já existem autores
    const authorCount = await Author.count();
    if (authorCount === 0) {
      // Criar autores de exemplo
      const authors = await Author.bulkCreate([
        {
          name: "Machado de Assis",
          biography:
            "Joaquim Maria Machado de Assis foi um escritor brasileiro, considerado por muitos críticos, estudiosos, escritores e leitores o maior nome da literatura brasileira.",
          birthDate: "1839-06-21",
          nationality: "Brasileira",
        },
        {
          name: "Clarice Lispector",
          biography:
            "Clarice Lispector foi uma escritora e jornalista brasileira nascida na Ucrânia. Autora de romances, contos e ensaios, é considerada uma das escritoras brasileiras mais importantes do século XX.",
          birthDate: "1920-12-10",
          nationality: "Brasileira",
        },
        {
          name: "Gabriel García Márquez",
          biography:
            "Gabriel José de la Concordia García Márquez foi um escritor, jornalista, editor, ativista e político colombiano. Prêmio Nobel de Literatura de 1982.",
          birthDate: "1927-03-06",
          nationality: "Colombiana",
        },
      ]);

      // Criar livros de exemplo
      await Book.bulkCreate([
        {
          title: "Dom Casmurro",
          isbn: "978-85-359-0277-5",
          publishedYear: 1899,
          genre: "Romance",
          pages: 256,
          publisher: "Companhia das Letras",
          description:
            "Romance de Machado de Assis que narra a história de Bentinho e Capitu.",
          quantity: 5,
          available: 5,
          authorId: authors[0].id,
        },
        {
          title: "O Cortiço",
          isbn: "978-85-359-0278-2",
          publishedYear: 1890,
          genre: "Naturalismo",
          pages: 304,
          publisher: "Ática",
          description:
            "Romance naturalista que retrata a vida em um cortiço no Rio de Janeiro.",
          quantity: 3,
          available: 3,
          authorId: authors[0].id,
        },
        {
          title: "A Hora da Estrela",
          isbn: "978-85-359-0279-9",
          publishedYear: 1977,
          genre: "Romance",
          pages: 96,
          publisher: "Rocco",
          description:
            "Último romance de Clarice Lispector, publicado pouco antes de sua morte.",
          quantity: 4,
          available: 4,
          authorId: authors[1].id,
        },
        {
          title: "Cem Anos de Solidão",
          isbn: "978-85-359-0280-5",
          publishedYear: 1967,
          genre: "Realismo Mágico",
          pages: 432,
          publisher: "Record",
          description:
            "Obra-prima de García Márquez que narra a saga da família Buendía.",
          quantity: 6,
          available: 6,
          authorId: authors[2].id,
        },
      ]);

      console.log("✅ Dados de exemplo criados!");
    }
  } catch (error) {
    console.error("❌ Erro ao criar dados de exemplo:", error);
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
