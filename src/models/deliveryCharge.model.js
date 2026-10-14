const mongoose = require("mongoose");

const tierSchema = new mongoose.Schema(
  {
    // Applies when minKm <= distance < maxKm
    minKm: { type: Number, required: true, min: 0 },
    maxKm: { type: Number, required: true, min: 0 },
    charge: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Single-document configuration for distance-based delivery charges
const deliveryChargeSchema = new mongoose.Schema(
  {
    tiers: {
      type: [tierSchema],
      default: [],
    },
    // Used when distance cannot be calculated or exceeds every tier
    defaultCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 250,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports =
  mongoose.models.DeliveryCharge ||
  mongoose.model("DeliveryCharge", deliveryChargeSchema);
