const mongoose = require("mongoose");

const sectionProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    nameEn: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    nameUr: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    products: {
      type: [sectionProductSchema],
      default: [],
    },
  },
  { timestamps: true }
);

sectionSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model("Section", sectionSchema);
