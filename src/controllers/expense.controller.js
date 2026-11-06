const mongoose = require("mongoose");
const Expense = require("../models/Expense.model");

// Add Expense
exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      data: expense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get Expenses
exports.getExpenses = async (req, res) => {
  try {
    const { category, from, to } = req.query;

    const filter = {};

    if (category) filter.category = category;

    if (from || to) {
      filter.expenseDate = {};

      if (from) filter.expenseDate.$gte = new Date(from);
      if (to) filter.expenseDate.$lte = new Date(to);
    }

    const expenses = await Expense.find(filter)
      .sort({ expenseDate: -1 });

    res.json({
      success: true,
      count: expenses.length,
      totalAmount: expenses.reduce(
        (total, item) => total + item.amount,
        0
      ),
      data: expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Expense Summary
exports.getExpenseSummary = async (req, res) => {
  try {
    const { from, to } = req.query;

    const match = {};

    if (from || to) {
      match.expenseDate = {};

      if (from) match.expenseDate.$gte = new Date(from);
      if (to) match.expenseDate.$lte = new Date(to);
    }

    const summary = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          totalRecords: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    const grandTotal = summary.reduce(
      (total, item) => total + item.totalAmount,
      0
    );

    res.json({
      success: true,
      grandTotal,
      categories: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Expense By ID
exports.getExpenseById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID"
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Expense
exports.updateExpense = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID"
      });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    res.json({
      success: true,
      message: "Expense updated successfully",
      data: expense
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID"
      });
    }

    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found"
      });
    }

    res.json({
      success: true,
      message: "Expense deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};