const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Maximum discount allowed when discountType is percentage
    maxDiscount: {
      type: Number,
      default: null,
      min: 0,
    },

    // Minimum cart/order amount required
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Maximum number of times this promo can be used
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },

    // Number of times this promo has already been used
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      required: true,
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

// Validate percentage discount
promoCodeSchema.pre("validate", function (next) {
  if (
    this.discountType === "percentage" &&
    this.discountValue > 100
  ) {
    return next(
      new Error("Percentage discount cannot be greater than 100")
    );
  }

  if (
    this.expiryDate &&
    this.startDate &&
    this.expiryDate <= this.startDate
  ) {
    return next(
      new Error("Expiry date must be after start date")
    );
  }

  next();
});

module.exports = mongoose.model("PromoCode", promoCodeSchema);