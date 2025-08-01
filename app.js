const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const { engine } = require("express-handlebars");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const booksRoutes = require("./routes/books");
const authorsRoutes = require("./routes/authors");
const loansRoutes = require("./routes/loans");
const usersRoutes = require("./routes/users");
const { testConnection } = require("./config/database");
const { syncDatabase } = require("./models");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração de arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Configuração de sessão
app.use(
  session({
    secret: "biblioteca-projeto-web-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Para desenvolvimento local
      maxAge: 1000 * 60 * 60 * 24, // 24 horas
    },
  })
);

// Configuração de view engine
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
    helpers: {
      formatDate: function (date) {
        if (!date) return "";
        return new Date(date).toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
      },
      eq: function (a, b) {
        return a == b;
      },
      unless: function (conditional, options) {
        if (!conditional) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
    },
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Rotas
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/books", booksRoutes);
app.use("/authors", authorsRoutes);
app.use("/loans", loansRoutes);
app.use("/users", usersRoutes);

// Rota principal - redireciona para login
app.get("/", (req, res) => {
  if (req.session.user) {
    res.redirect("/dashboard");
  } else {
    res.redirect("/auth/login");
  }
});

// Middleware de tratamento de erro 404
app.use((req, res) => {
  res.status(404).send("Página não encontrada");
});

// Iniciar servidor
async function startServer() {
  try {
    // Testar conexão com banco de dados
    await testConnection();

    // Sincronizar modelos
    await syncDatabase();

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Acesse: http://localhost:${PORT}`);
      console.log(`Banco SQLite: database.sqlite`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();
