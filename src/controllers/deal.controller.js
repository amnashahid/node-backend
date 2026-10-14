const mongoose = require("mongoose");
const Deal = require("../models/deal.model");
const Product = require("../models/product.model");

const imageUrl = (filename) => `/Uploads/deals/${filename}`;

function parseProducts(value) {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  return Array.isArray(value) ? value : null;
}

function parseDate(value) {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

async function validateProducts(products) {
  if (!products || products.length === 0) {
    return { error: "At least one product and deal price are required." };
  }

  const ids = [];
  const seenIds = new Set();

  for (const item of products) {
    if (
      !item ||
      !mongoose.isValidObjectId(item.productId) ||
      item.price === undefined ||
      item.price === null ||
      item.price === "" ||
      !Number.isFinite(Number(item.price)) ||
      Number(item.price) < 0
    ) {
      return {
        error: "Each product must have a valid productId and non-negative price.",
      };
    }

    const productId = item.productId.toString();
    if (seenIds.has(productId)) {
      return { error: "A product can only be added once to a deal." };
    }
    seenIds.add(productId);
    ids.push(productId);
  }

  const foundCount = await Product.countDocuments({ _id: { $in: ids } });
  if (foundCount !== ids.length) {
    return { error: "One or more products were not found." };
  }

  return {
    products: products.map((item) => ({
      productId: item.productId,
      price: Number(item.price),
    })),
  };
}

function buildDateRange(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) {
    return { error: "Valid startDate and endDate are required." };
  }

  if (start >= end) {
    return { error: "startDate must be earlier than endDate." };
  }

  return { startDate: start, endDate: end };
}

exports.createDeal = async (req, res, next) => {
  try {
    const { name, description, startDate, endDate } = req.body;
    const products = parseProducts(req.body.products);
    const isActive = parseBoolean(req.body.isActive, true);

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Deal name is required.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Deal image is required.",
      });
    }

    if (typeof req.body.isActive !== "undefined" && isActive === null) {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean.",
      });
    }

    const dateRange = buildDateRange(startDate, endDate);
    if (dateRange.error) {
      return res.status(400).json({ success: false, message: dateRange.error });
    }

    const productResult = await validateProducts(products);
    if (productResult.error) {
      return res.status(400).json({
        success: false,
        message: productResult.error,
      });
    }

    const deal = await Deal.create({
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      image: imageUrl(req.file.filename),
      ...dateRange,
      products: productResult.products,
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Deal created successfully.",
      data: deal,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getDeals = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.isActive !== undefined) {
      if (!["true", "false"].includes(req.query.isActive)) {
        return res.status(400).json({
          success: false,
          message: "isActive query must be true or false.",
        });
      }
      filter.isActive = req.query.isActive === "true";
    }

    const deals = await Deal.find(filter)
      .populate("products.productId", "nameEn nameUr image price salePrice")
      .sort({ startDate: 1, createdAt: -1 });

    return res.json({
      success: true,
      count: deals.length,
      data: deals,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getDealById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deal ID.",
      });
    }

    const deal = await Deal.findById(req.params.id).populate(
      "products.productId",
      "nameEn nameUr image price salePrice"
    );

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found.",
      });
    }

    return res.json({ success: true, data: deal });
  } catch (error) {
    return next(error);
  }
};

exports.updateDeal = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deal ID.",
      });
    }

    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found.",
      });
    }

    const { name, description, startDate, endDate } = req.body;
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Deal name must be a non-empty string.",
        });
      }
      deal.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be a string.",
        });
      }
      deal.description = description.trim();
    }

    if (startDate !== undefined || endDate !== undefined) {
      const dateRange = buildDateRange(
        startDate === undefined ? deal.startDate : startDate,
        endDate === undefined ? deal.endDate : endDate
      );
      if (dateRange.error) {
        return res.status(400).json({
          success: false,
          message: dateRange.error,
        });
      }
      deal.startDate = dateRange.startDate;
      deal.endDate = dateRange.endDate;
    }

    if (req.body.products !== undefined) {
      const products = parseProducts(req.body.products);
      const productResult = await validateProducts(products);
      if (productResult.error) {
        return res.status(400).json({
          success: false,
          message: productResult.error,
        });
      }
      deal.products = productResult.products;
    }

    if (req.body.isActive !== undefined) {
      const isActive = parseBoolean(req.body.isActive);
      if (isActive === null) {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean.",
        });
      }
      deal.isActive = isActive;
    }

    if (req.file) {
      deal.image = imageUrl(req.file.filename);
    }

    await deal.save();

    return res.json({
      success: true,
      message: "Deal updated successfully.",
      data: deal,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteDeal = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deal ID.",
      });
    }

    const deal = await Deal.findByIdAndDelete(req.params.id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found.",
      });
    }

    return res.json({
      success: true,
      message: "Deal deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
};
