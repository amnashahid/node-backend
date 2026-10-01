const Section = require("../models/section.model");
const Product = require("../models/product.model");

const createSection = async (req, res, next) => {
  try {
    const {
      nameEn,
      nameUr,
      description,
      products,
      isActive,
    } = req.body;

    if (!nameEn || !nameUr) {
      return res.status(400).json({
        success: false,
        message: "English and Urdu section names are required",
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
    }

    // Validate products
    const productIds = products.map((p) => p.productId);

    const existingProducts = await Product.find({
      _id: { $in: productIds },
    });

    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are invalid",
      });
    }

    const section = await Section.create({
      nameEn,
      nameUr,
      description: description || "",

      products: products.map((p) => ({
        productId: p.productId,
      })),

      isActive:
        isActive === undefined ? true : isActive === "true" || isActive === true,

    });

    const result = await Section.findById(section._id).populate(
      "products.productId"
    );

    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSections = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const sections = await Section.find(filter)
      .populate("products.productId")
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: sections,
    });
  } catch (error) {
    next(error);
  }
};
  
const getSectionById = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id).populate(
      "products.productId"
    );

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    res.json({
      success: true,
      data: section,
    });
  } catch (error) {
    next(error);
  }
};

const updateSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const {
      nameEn,
      nameUr,
      description,
      products,
      isActive,
      startDate,
      endDate,
      sortOrder,
    } = req.body;

    if (!nameEn || !nameUr) {
      return res.status(400).json({
        success: false,
        message: "English and Urdu section names are required",
      });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product is required",
      });
    }

    const productIds = products.map((p) => p.productId);

    const existingProducts = await Product.find({
      _id: { $in: productIds },
    });

    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are invalid",
      });
    }

    section.nameEn = nameEn;
    section.nameUr = nameUr;
    section.description = description || "";

    section.products = products.map((p) => ({
      productId: p.productId,
      quantity: Number(p.quantity) || 1,
      dealPrice: Number(p.dealPrice) || 0,
    }));

    if (req.file) {
      section.image = `/images/deals/${req.file.filename}`;
    }

    section.isActive =
      isActive === undefined
        ? section.isActive
        : isActive === "true" || isActive === true;


    await section.save();

    const result = await Section.findById(section._id).populate(
      "products.productId"
    );

    res.json({
      success: true,
      message: "Section updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    await Section.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSection,
  getSections,
  getSectionById,
  updateSection,
  deleteSection,
};