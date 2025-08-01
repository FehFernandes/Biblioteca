const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Loan = sequelize.define(
  "Loan",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    bookId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "books",
        key: "id",
      },
    },
    loanDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    returnDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "returned", "overdue"),
      allowNull: false,
      defaultValue: "active",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "loans",
    hooks: {
      beforeCreate: (loan) => {
        // Define data de devolução para 14 dias após o empréstimo
        if (!loan.dueDate) {
          const dueDate = new Date(loan.loanDate);
          dueDate.setDate(dueDate.getDate() + 14);
          loan.dueDate = dueDate;
        }
      },
    },
  }
);

module.exports = Loan;
