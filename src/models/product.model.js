const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
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

    image: {
      type: String,
      default: null,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    salePrice: {
      type: Number,
      default: null,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
    },

    sku: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },

    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    unit: {
      type: String,
      enum: [
        "piece",
        "kg",
        "gram",
        "liter",
        "ml",
        "pack",
        "box",
        "dozen",
      ],
      default: "piece",
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

module.exports = mongoose.model("Product", productSchema);