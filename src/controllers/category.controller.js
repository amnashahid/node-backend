const Category = require("../models/category.model");
const upload = require("../middleware/upload.middleware");
const fs = require("fs");
const path = require("path");
const { pipeline } = require('stream/promises');

// ========================================
// CREATE CATEGORY / SUBCATEGORY
// ========================================
const createCategory = async (req, res, next) => {
  try {
    const {
      nameEn,
      nameUr,
      parentCategoryId,
      isActive,
      sortOrder,
      topCategory,
    } = req.body;

    if (!nameEn || !nameUr) {
      return res.status(400).json({
        success: false,
        message: "English and Urdu category names are required",
      });
    }
  
    let parentId = null;

    if (
      parentCategoryId &&
      parentCategoryId !== "0" &&
      parentCategoryId !== 0
    ) {
      // Check parent exists
      const parentCategory = await Category.findById(parentCategoryId);

      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
      }

      // Prevent subcategory from becoming a parent
      if (parentCategory.parentCategoryId) {
        return res.status(400).json({
          success: false,
          message: "A subcategory cannot have subcategories",
        });
      }

      parentId = parentCategory._id;
    }

    const category = new Category({
      nameEn,
      nameUr,
      parentCategoryId: parentId,
      isActive:
        isActive !== undefined ? isActive : true,
      topCategory: topCategory === true || topCategory === "true",
      sortOrder:
        sortOrder !== undefined ? Number(sortOrder) : 0,
      image: req.file ?  `/uploads/${req.file.filename}` : null,
    });

    await category.save();

    return res.status(201).json({
      success: true,
      message: parentId
        ? "Subcategory created successfully"
        : "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET ALL CATEGORIES
// ========================================
const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find()
      .populate("parentCategoryId", "nameEn nameUr")
    //   .sort({
    //     parentCategoryId: 1,
    //     sortOrder: 1,
    //     nameEn: 1,
    //   });
    ;

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET MAIN CATEGORIES ONLY
// ========================================
const getMainCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      parentCategoryId: null,
    }).sort({
      sortOrder: 1,
      nameEn: 1,
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET TOP CATEGORIES ONLY
// ========================================
const getTopCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({
      topCategory: true,
      isActive: true,
    }).sort({
      sortOrder: 1,
      nameEn: 1,
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET SUBCATEGORIES
// ========================================
const getSubCategories = async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    const parentCategory = await Category.findOne({
      _id: categoryId,
      parentCategoryId: null,
    });

    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: "Parent category not found",
      });
    }

    const subCategories = await Category.find({
      parentCategoryId: categoryId,
    }).sort({
      sortOrder: 1,
      nameEn: 1,
    });

    return res.status(200).json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// GET CATEGORY BY ID
// ========================================
const getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("parentCategoryId", "nameEn nameUr");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// UPDATE CATEGORY
// ========================================
const updateCategory = async (req, res, next) => {
  try {
    const { nameEn, nameUr, parentCategoryId, isActive, sortOrder } =
      req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ------------------------------------
    // Validate parent category
    // ------------------------------------
    if (
      parentCategoryId !== undefined &&
      parentCategoryId !== null &&
      parentCategoryId !== "" &&
      parentCategoryId !== "0"
    ) {
      // Cannot be its own parent
      if (parentCategoryId.toString() === category._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "A category cannot be its own parent",
        });
      }

      const parentCategory = await Category.findById(parentCategoryId);

      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: "Parent category not found",
        });
      }

      // Parent must be a main category
      if (parentCategory.parentCategoryId) {
        return res.status(400).json({
          success: false,
          message: "A subcategory cannot have subcategories",
        });
      }

      category.parentCategoryId = parentCategory._id;
    } else {
      category.parentCategoryId = null;
    }

    if (nameEn !== undefined) {
      category.nameEn = nameEn;
    }

    if (nameUr !== undefined) {
      category.nameUr = nameUr;
    }

    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    if (sortOrder !== undefined) {
      category.sortOrder = Number(sortOrder);
    }

    if (req.file) {
      category.image = `/uploads/${req.file.filename}`;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// UPDATE TOP CATEGORY FLAG
// ========================================
const updateTopCategory = async (req, res, next) => {
  try {
    const { topCategory } = req.body;

    if (
      topCategory !== true &&
      topCategory !== false &&
      topCategory !== "true" &&
      topCategory !== "false"
    ) {
      return res.status(400).json({
        success: false,
        message: "topCategory must be a boolean",
      });
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { topCategory: topCategory === true || topCategory === "true" },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Top category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// DELETE CATEGORY
// ========================================
const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // If deleting a main category, check subcategories
    if (!category.parentCategoryId) {
      const subCategories = await Category.countDocuments({
        parentCategoryId: category._id,
      });

      if (subCategories > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot delete category because it contains subcategories",
        });
      }
    }

    await Category.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
const importCategories = async (req, res, next) => {
  try {
    const sourceCategories = req.body.categories || req.body;

    if (!Array.isArray(sourceCategories)) {
      return res.status(400).json({
        success: false,
        message: "Request body must contain an array of categories.",
      });
    }

    const result = {
      categoriesCreated: 0,
      subcategoriesCreated: 0,
      errors: [],
    };

    for (const source of sourceCategories) {
      console.log(source.name)
      let parentCategory;
      try {
        if (!source.name) {
          throw new Error("Category name is required.");
        }
  const completeImage =source.image

            if(source.image ){
            // 1. Generate a unique filename to prevent overwriting
            const fileExtension = path.extname(new URL(completeImage).pathname) || '.jpg';
            const filename = `category-${source.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}${fileExtension}`;
            
            // Define paths
            const uploadDir = path.join(__dirname, '../uploads/categories');
            const absoluteDestinationPath = path.join(uploadDir, filename);
            var relativeDatabasePath = `/uploads/categories/${filename}`; // Public URL path for your API

            // 2. Ensure directory exists 
            fs.mkdirSync(uploadDir, { recursive: true })
            // 3. Download and stream the image directly to the disk
            const response = await fetch(completeImage);
            
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            await pipeline(
                response.body, 
                fs.createWriteStream(absoluteDestinationPath)
            );
          }
          if(!source.image) relativeDatabasePath = '';
        // Create parent category
        parentCategory = await Category.create({
          nameEn: source.name,
          nameUr: source.name_ur || source.name,
          image: relativeDatabasePath || null,
          parentCategoryId: null,
          isActive: Number(source.status) === 1,
          topCategory: true,
          sortOrder: 0,
        });

        result.categoriesCreated++;

        // Create subcategories
        const subcategories = Array.isArray(source.subcat)
          ? source.subcat
          : [];
        console.log(subcategories)
        console.log(source.name)
        for (const sub of subcategories) {
          try {
            if (!sub.name) {
              throw new Error("Subcategory name is required.");
            }

            await Category.create({
              nameEn: sub.name,
              nameUr: sub.name_ur || sub.name,
              image: relativeDatabasePath || null,
              parentCategoryId: parentCategory._id,
              isActive: Number(sub.status) === 1,
              topCategory: false,
              sortOrder: 0,
            });

            result.subcategoriesCreated++;
          } catch (error) {
            result.errors.push({
              category: source.name,
              subcategory: sub.name || null,
              message: error.message,
            });
          }
        }
      } catch (error) {
        result.errors.push({
          category: source.name || null,
          message: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Category import completed.",
      data: result,
    });
  } catch (error) {
    console.error("Category import error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to import categories.",
      error: error.message,
    });
  }
};
module.exports = {
  createCategory,
  getCategories,
  getMainCategories,
  getTopCategories,
  getSubCategories,
  getCategoryById,
  updateCategory,
  updateTopCategory,
  deleteCategory,
  importCategories
};