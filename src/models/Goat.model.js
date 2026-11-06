const mongoose = require("mongoose");

const goatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    ageAtPurchase: {
      value: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        enum: ["days", "months", "years"],
        default: "months"
      }
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true
    },

    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },

    purchaseDate: {
      type: Date,
      default: Date.now
    },

    dewormingDate: {
      type: Date,
      default: null
    },

    notes: {
      type: String,
      default: ""
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Goat", goatSchema);