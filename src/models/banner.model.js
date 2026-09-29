const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
    },

    // Position in the banner slider
    // 1 = first, 2 = second, 3 = third...
    index: {
      type: Number,
      required: true,
      min: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Optional fields for future use
    title: {
      type: String,
      trim: true,
      default: "",
    },

    link: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Useful for retrieving banners in display order
bannerSchema.index({
  index: 1,
  isActive: 1,
});

module.exports = mongoose.model("Banner", bannerSchema);