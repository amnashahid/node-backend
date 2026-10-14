const mongoose = require("mongoose");

const dealProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const dealSchema = new mongoose.Schema(
  {
    name: {
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
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    products: {
      type: [dealProductSchema],
      required: true,
      validate: {
        validator: (products) => products.length > 0,
        message: "A deal must include at least one product.",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

dealSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model("Deal", dealSchema);
