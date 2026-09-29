const mongoose = require("mongoose");

const deliverySlotSchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      // 0 = Sunday
      // 1 = Monday
      // 2 = Tuesday
      // 3 = Wednesday
      // 4 = Thursday
      // 5 = Friday
      // 6 = Saturday
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
      // Example: "10:00"
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
      // Example: "12:00"
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

module.exports = mongoose.model("DeliverySlot", deliverySlotSchema);