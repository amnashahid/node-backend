const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    storeNotes: {
      type: String,
      trim: true,
      default: "",
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    radius: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },

    radiusUnit: {
      type: String,
      enum: ["km", "meter"],
      default: "km",
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
  "StoreSettings",
  storeSettingsSchema
);