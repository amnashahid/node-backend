const mongoose = require("mongoose");

const orderTimelineSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Ready",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      required: true,
    },

    title: {
      type: String,
    },

    message: {
      type: String,
      default: "",
    },

    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    changedByType: {
      type: String,
      enum: [
        "customer",
        "admin",
        "system",
      ],
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "OrderTimeline",
  orderTimelineSchema
);