const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },

    distanceKm: {
      type: Number,
      required: true,
      min: 0,
    },

    slotId: {
      type: String,
      required: true,
    },

    slotText: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    delivery: {
      type: deliverySchema,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // Current order status
    status: {
      type: String,
      required: true,
      default: "pending",
      trim: true,
      index: true,
    },

    // Optional display text for admin/customer UI
    statusText: {
      type: String,
      default: "Order Pending",
      trim: true,
    },

    // Payment status
    paymentStatus: {
      type: String,
      required: true,
      default: "pending",
      trim: true,
      index: true,
    },

    // Payment method, e.g. COD, JazzCash, etc.
    paymentMethod: {
      type: String,
      default: "COD",
      trim: true,
    },

    // When the order was actually completed
    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);