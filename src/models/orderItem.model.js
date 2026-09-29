const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    /*
     * NULL:
     *   Product was purchased individually.
     *
     * DEAL ID:
     *   Product came from a deal.
     *
     * This allows the same product to appear twice:
     *
     * Juice A + dealId = deal123
     * Juice A + dealId = null
     */
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null,
      index: true,
    },

    // Product snapshot
    productNameEn: {
      type: String,
      required: true,
    },

    productNameUr: {
      type: String,
      default: "",
    },

    sku: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Price per unit at time of order
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // quantity * unitPrice
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Useful for showing deal information
    dealPrice: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "OrderItem",
  orderItemSchema
);