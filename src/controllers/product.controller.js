const Product = require("../models/product.model");
const Category = require("../models/category.model");
const Brand = require("../models/brand.model");

// CREATE
const createProduct = async (req, res, next) => {
  try {
    const {
      nameEn,
      nameUr,
      description,
      price,
      salePrice,
      isFeatured,
      isActive,
      categoryId,
      subCategoryId,
      brandId,
      sku,
      stockQuantity,
      unit,
      sortOrder,
    } = req.body;

    if (!nameEn || !nameUr) {
      return res.status(400).json({
        success: false,
        message: "English and Urdu product names are required",
      });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({
        success: false,
        message: "Price is required",
      });
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Validate category
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    // categoryId must point to a parent category
    if (category.parentCategoryId && category.parentCategoryId !== 0) {
      return res.status(400).json({
        success: false,
        message: "categoryId must be a parent category",
      });
    }

    // Validate subcategory
    if (subCategoryId) {
      const subCategory = await Category.findById(subCategoryId);

      if (!subCategory) {
        return res.status(400).json({
          success: false,
          message: "Sub category not found",
        });
      }

      if (
        !subCategory.parentCategoryId ||
        subCategory.parentCategoryId.toString() !== categoryId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message: "Sub category does not belong to selected category",
        });
      }
    }

    // Validate brand
    if (brandId) {
      const brand = await Brand.findById(brandId);

      if (!brand) {
        return res.status(400).json({
          success: false,
          message: "Brand not found",
        });
      }
    }

    // Sale price cannot be greater than regular price
    if (
      salePrice !== undefined &&
      salePrice !== null &&
      salePrice !== "" &&
      Number(salePrice) >= Number(price)
    ) {
      return res.status(400).json({
        success: false,
        message: "Sale price must be less than regular price",
      });
    }

    // Image
    let image = null;

    if (req.file) {
      image = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.create({
      nameEn,
      nameUr,
      description,
      image,
      price: Number(price),
      salePrice:
        salePrice !== undefined &&
        salePrice !== null &&
        salePrice !== ""
          ? Number(salePrice)
          : null,
      isFeatured:
        isFeatured === true || isFeatured === "true",
      isActive:
        isActive === undefined
          ? true
          : isActive === true || isActive === "true",
      categoryId,
      subCategoryId: subCategoryId || null,
      brandId: brandId || null,
      sku: sku || undefined,
      stockQuantity: Number(stockQuantity || 0),
      unit: unit || "piece",
      sortOrder: Number(sortOrder || 0),
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL
const getProducts = async (req, res, next) => {
  try {
    const {
      categoryId,
      subCategoryId,
      brandId,
      isFeatured,
      isActive,
      search,
    } = req.query;

    const filter = {};

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (subCategoryId) {
      filter.subCategoryId = subCategoryId;
    }

    if (brandId) {
      filter.brandId = brandId;
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured === "true";
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.$or = [
        {
          nameEn: {
            $regex: search,
            $options: "i",
          },
        },
        {
          nameUr: {
            $regex: search,
            $options: "i",
          },
        },
        {
          sku: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const products = await Product.find(filter)
      .populate("categoryId", "nameEn nameUr")
      .populate("subCategoryId", "nameEn nameUr")
      .populate("brandId", "nameEn nameUr")
      .sort({
        sortOrder: 1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// GET ONE
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("categoryId", "nameEn nameUr")
      .populate("subCategoryId", "nameEn nameUr")
      .populate("brandId", "nameEn nameUr");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const {
      nameEn,
      nameUr,
      description,
      price,
      salePrice,
      isFeatured,
      isActive,
      categoryId,
      subCategoryId,
      brandId,
      sku,
      stockQuantity,
      unit,
      sortOrder,
    } = req.body;

    const finalCategoryId = categoryId || product.categoryId;
    const finalSubCategoryId =
      subCategoryId !== undefined
        ? subCategoryId || null
        : product.subCategoryId;

    const finalPrice =
      price !== undefined ? Number(price) : product.price;

    const finalSalePrice =
      salePrice !== undefined && salePrice !== ""
        ? Number(salePrice)
        : null;

    // Validate category
    const category = await Category.findById(finalCategoryId);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category not found",
      });
    }

    if (category.parentCategoryId && category.parentCategoryId !== 0) {
      return res.status(400).json({
        success: false,
        message: "categoryId must be a parent category",
      });
    }

    // Validate subcategory
    if (finalSubCategoryId) {
      const subCategory = await Category.findById(
        finalSubCategoryId
      );

      if (!subCategory) {
        return res.status(400).json({
          success: false,
          message: "Sub category not found",
        });
      }

      if (
        !subCategory.parentCategoryId ||
        subCategory.parentCategoryId.toString() !==
          finalCategoryId.toString()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Sub category does not belong to selected category",
        });
      }
    }

    // Validate sale price
    if (
      finalSalePrice !== null &&
      finalSalePrice >= finalPrice
    ) {
      return res.status(400).json({
        success: false,
        message: "Sale price must be less than regular price",
      });
    }

    product.nameEn = nameEn ?? product.nameEn;
    product.nameUr = nameUr ?? product.nameUr;
    product.description =
      description ?? product.description;

    product.price = finalPrice;
    product.salePrice = finalSalePrice;

    if (isFeatured !== undefined) {
      product.isFeatured =
        isFeatured === true || isFeatured === "true";
    }

    if (isActive !== undefined) {
      product.isActive =
        isActive === true || isActive === "true";
    }

    product.categoryId = finalCategoryId;
    product.subCategoryId = finalSubCategoryId;

    if (brandId !== undefined) {
      product.brandId = brandId || null;
    }

    if (sku !== undefined) {
      product.sku = sku;
    }

    if (stockQuantity !== undefined) {
      product.stockQuantity = Number(stockQuantity);
    }

    if (unit !== undefined) {
      product.unit = unit;
    }

    if (sortOrder !== undefined) {
      product.sortOrder = Number(sortOrder);
    }
    console.log( `/uploads/products/${req.file.filename}`);

    // Replace image
    if (req.file) {
      product.image = `/uploads/products/${req.file.filename}`;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};