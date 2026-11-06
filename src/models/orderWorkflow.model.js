const mongoose = require("mongoose");

const orderWorkflowSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    fromStatus: {
      type: String,
      default: "",
      trim: true,
    },

    toStatus: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    statusText: {
      type: String,
      default: "",
      trim: true,
    },

    // Who performed the status change
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Optional description/reason
    note: {
      type: String,
      default: "",
      trim: true,
    },

    // Useful if the change comes from customer/admin/system
    source: {
      type: String,
      default: "system",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

orderWorkflowSchema.index({
  order: 1,
  createdAt: 1,
});

module.exports =
  mongoose.models.OrderWorkflow ||
  mongoose.model("OrderWorkflow", orderWorkflowSchema);