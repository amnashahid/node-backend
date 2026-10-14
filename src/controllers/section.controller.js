const mongoose = require("mongoose");
const Section = require("../models/section.model");
const Product = require("../models/product.model");

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

function parseProducts(value) {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  if (!Array.isArray(value)) return null;
  return value;
}

async function validateProducts(products) {
  if (!products) {
    return { error: "Products must be an array of product IDs." };
  }

  const ids = [];
  const seenIds = new Set();

  for (const item of products) {
    const productId =
      typeof item === "string" ? item : item?.productId;

    if (!mongoose.isValidObjectId(productId)) {
      return { error: "Each section product must have a valid productId." };
    }

    const id = productId.toString();
    if (seenIds.has(id)) {
      return { error: "A product can only be added to a section once." };
    }

    seenIds.add(id);
    ids.push(id);
  }

  if (ids.length > 0) {
    const foundCount = await Product.countDocuments({ _id: { $in: ids } });
    if (foundCount !== ids.length) {
      return { error: "One or more products were not found." };
    }
  }

  return { products: ids.map((productId) => ({ productId })) };
}

const populatedSectionQuery = (query) =>
  query.populate(
    "products.productId",
    "nameEn nameUr sku image price salePrice"
  );

exports.getSections = async (req, res, next) => {
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

    const sections = await populatedSectionQuery(
      Section.find(filter).sort({ createdAt: -1 })
    );

    return res.json({
      success: true,
      count: sections.length,
      data: sections,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getSectionById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID.",
      });
    }

    const section = await populatedSectionQuery(
      Section.findById(req.params.id)
    );

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

    return res.json({ success: true, data: section });
  } catch (error) {
    return next(error);
  }
};

exports.createSection = async (req, res, next) => {
  try {
    const { nameEn, nameUr, description } = req.body;
    const isActive = parseBoolean(req.body.isActive, true);

    if (typeof nameEn !== "string" || !nameEn.trim()) {
      return res.status(400).json({
        success: false,
        message: "English section name is required.",
      });
    }

    if (typeof nameUr !== "string" || !nameUr.trim()) {
      return res.status(400).json({
        success: false,
        message: "Urdu section name is required.",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string.",
      });
    }

    if (isActive === null) {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean.",
      });
    }

    const products = await validateProducts(req.body.products);
    if (products.error) {
      return res.status(400).json({
        success: false,
        message: products.error,
      });
    }

    const section = await Section.create({
      nameEn: nameEn.trim(),
      nameUr: nameUr.trim(),
      description: description?.trim() || "",
      isActive,
      products: products.products,
    });

    const populatedSection = await populatedSectionQuery(
      Section.findById(section._id)
    );

    return res.status(201).json({
      success: true,
      message: "Section created successfully.",
      data: populatedSection,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID.",
      });
    }

    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

    const { nameEn, nameUr, description } = req.body;

    for (const [field, value] of [
      ["nameEn", nameEn],
      ["nameUr", nameUr],
    ]) {
      if (
        value !== undefined &&
        (typeof value !== "string" || !value.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a non-empty string.`,
        });
      }
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({
        success: false,
        message: "Description must be a string.",
      });
    }

    if (nameEn !== undefined) section.nameEn = nameEn.trim();
    if (nameUr !== undefined) section.nameUr = nameUr.trim();
    if (description !== undefined) section.description = description.trim();

    if (req.body.isActive !== undefined) {
      const isActive = parseBoolean(req.body.isActive);
      if (isActive === null) {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean.",
        });
      }
      section.isActive = isActive;
    }

    if (req.body.products !== undefined) {
      const products = await validateProducts(req.body.products);
      if (products.error) {
        return res.status(400).json({
          success: false,
          message: products.error,
        });
      }
      section.products = products.products;
    }

    await section.save();

    const populatedSection = await populatedSectionQuery(
      Section.findById(section._id)
    );

    return res.json({
      success: true,
      message: "Section updated successfully.",
      data: populatedSection,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteSection = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID.",
      });
    }

    const section = await Section.findByIdAndDelete(req.params.id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found.",
      });
    }

    return res.json({
      success: true,
      message: "Section deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
};
