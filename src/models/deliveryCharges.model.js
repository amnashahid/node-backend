const mongoose = require("mongoose");

const deliveryChargeSchema = new mongoose.Schema(
  {
    minDistance: {
      type: Number,
      required: true,
      min: 0,
    },

    maxDistance: {
      type: Number,
      required: true,
      min: 0,
    },

    charge: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "DeliveryCharge",
  deliveryChargeSchema
);