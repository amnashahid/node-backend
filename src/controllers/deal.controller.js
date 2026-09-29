const Deal = require("../models/deal.model");
const Product = require("../models/product.model");

const createDeal = async (req, res, next) => {
  try {
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
        message: "English and Urdu deal names are required",
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

    const deal = await Deal.create({
      nameEn,
      nameUr,
      description: description || "",
      image: req.file
        ? `/images/deals/${req.file.filename}`
        : "",

      products: products.map((p) => ({
        productId: p.productId,
        quantity: Number(p.quantity) || 1,
        dealPrice: Number(p.dealPrice) || 0,
      })),

      isActive:
        isActive === undefined ? true : isActive === "true" || isActive === true,

      startDate: startDate || null,
      endDate: endDate || null,
      sortOrder: Number(sortOrder) || 0,
    });

    const result = await Deal.findById(deal._id).populate(
      "products.productId"
    );

    return res.status(201).json({
      success: true,
      message: "Deal created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getDeals = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const deals = await Deal.find(filter)
      .populate("products.productId")
      .sort({ sortOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: deals,
    });
  } catch (error) {
    next(error);
  }
};

const getDealById = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id).populate(
      "products.productId"
    );

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    res.json({
      success: true,
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

const updateDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
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
        message: "English and Urdu deal names are required",
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

    deal.nameEn = nameEn;
    deal.nameUr = nameUr;
    deal.description = description || "";

    deal.products = products.map((p) => ({
      productId: p.productId,
      quantity: Number(p.quantity) || 1,
      dealPrice: Number(p.dealPrice) || 0,
    }));

    if (req.file) {
      deal.image = `/images/deals/${req.file.filename}`;
    }

    deal.isActive =
      isActive === undefined
        ? deal.isActive
        : isActive === "true" || isActive === true;

    deal.startDate = startDate || null;
    deal.endDate = endDate || null;
    deal.sortOrder = Number(sortOrder) || 0;

    await deal.save();

    const result = await Deal.findById(deal._id).populate(
      "products.productId"
    );

    res.json({
      success: true,
      message: "Deal updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDeal = async (req, res, next) => {
  try {
    const deal = await Deal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    await Deal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
};