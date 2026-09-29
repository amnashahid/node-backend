const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    nameEn: {
      type: String,
      required: true,
      trim: true,
    },

    nameUr: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        quantity: {
          type: Number,
          default: 1,
          min: 1,
        },

        dealPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Deal", dealSchema);