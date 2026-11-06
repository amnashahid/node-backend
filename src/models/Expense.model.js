const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      enum: [
        "feed",
        "medicine",
        "veterinary",
        "labor",
        "transport",
        "equipment",
        "maintenance",
        "breeding",
        "other"
      ],
      default: "other"
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    expenseDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    description: {
      type: String,
      default: ""
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "bank", "online", "other"],
      default: "cash"
    },

    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

expenseSchema.index({ expenseDate: -1 });
expenseSchema.index({ category: 1 });

module.exports = mongoose.model("Expense", expenseSchema);