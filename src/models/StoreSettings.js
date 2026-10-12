
const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    storeNotes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },

    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },

    lon: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },

    currency: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{3}$/,
      default: "PKR",
    },

    defaultDeliveryCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 150,
    },

    minimumOrderAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 500,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports =
  mongoose.models.StoreSettings ||
  mongoose.model("StoreSettings", storeSettingsSchema);
