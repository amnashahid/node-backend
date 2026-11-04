const express = require("express");
const router = express.Router();

const {
  createExpense,
  getExpenses,
  getExpenseById,
  getExpenseSummary,
  updateExpense,
  deleteExpense
} = require("../controllers/expense.controller");

router.post("/", createExpense);

// Summary must come before /:id
router.get("/summary", getExpenseSummary);

router.get("/", getExpenses);
router.get("/:id", getExpenseById);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;