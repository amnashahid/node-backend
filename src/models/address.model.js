const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Home, Office, Other
    label: {
      type: String,
      trim: true,
      required: true,
    },

    recipientName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
      required: true,
    },

    addressLine1: {
      type: String,
      trim: true,
      required: true,
    },

    addressLine2: {
      type: String,
      trim: true,
      default: "",
    },

    area: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    postalCode: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    deliveryInstructions: {
      type: String,
      trim: true,
      default: "",
    },

    isDefault: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model("Address", addressSchema);