const mongoose = require("mongoose");

const breedingSchema = new mongoose.Schema(
  {
    femaleGoat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goat",
      required: true
    },

    maleGoats: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Goat",
        required: true
      }
    ],

    breedingDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    pregnancyStatus: {
      type: String,
      enum: [
        "unknown",
        "pending",
        "pregnant",
        "not_pregnant"
      ],
      default: "unknown"
    },

    expectedDeliveryDate: {
      type: Date,
      default: null
    },

    actualDeliveryDate: {
      type: Date,
      default: null
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

breedingSchema.index({ femaleGoat: 1, breedingDate: -1 });

module.exports = mongoose.model("Breeding", breedingSchema);