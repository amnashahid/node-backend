const mongoose = require("mongoose");

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const deliverySlotSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      default: "",
      maxlength: 100,
    },
    // 24-hour "HH:mm" in the store's local time
    startTime: {
      type: String,
      required: true,
      match: TIME_PATTERN,
    },
    endTime: {
      type: String,
      required: true,
      match: TIME_PATTERN,
    },
    // 0 = Sunday ... 6 = Saturday
    daysOfWeek: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
      validate: {
        validator: (days) =>
          days.length > 0 &&
          days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6),
        message: "daysOfWeek must contain values from 0 (Sunday) to 6 (Saturday).",
      },
    },
    // A slot is hidden once fewer than this many minutes remain before it starts
    minLeadMinutes: {
      type: Number,
      default: 60,
      min: 0,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

deliverySlotSchema.index({ isActive: 1, sortOrder: 1, startTime: 1 });

module.exports =
  mongoose.models.DeliverySlot ||
  mongoose.model("DeliverySlot", deliverySlotSchema);
