const express = require("express");

const router = express.Router();

const {
  createCategory,
  getCategories,
  getMainCategories,
  getTopCategories,
  getSubCategories,
  getCategoryById,
  updateCategory,
  updateTopCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const { uploadImage } = require("../middleware/upload.middleware");

// ========================================
// PUBLIC / AUTHENTICATED READ
// ========================================

// Get all categories and subcategories
router.get(
  "/",
  authMiddleware,
  getCategories
);

// // Get main categories
// router.get(
//   "/main",
//   authMiddleware,
//   getMainCategories
// );

// Get top categories (must be before "/:id")
router.get(
  "/top",
  authMiddleware,
  getTopCategories
);

// Get subcategories of a category
router.get(
  "/:categoryId/subcategories",
  authMiddleware,
  getSubCategories
);

// Get category by ID
router.get(
  "/:id",
  authMiddleware,
  getCategoryById
);


// ========================================
// ADMIN ONLY
// ========================================

// Create category/subcategory
router.post(
  "/",
  authMiddleware,
  //roleMiddleware("admin"),
 uploadImage.single("image"),
  createCategory
);

// Toggle top category flag
router.patch(
  "/:id/top",
  authMiddleware,
  roleMiddleware("admin"),
  updateTopCategory
);

// Update category/subcategory
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  uploadImage.single("image"),
  updateCategory
);

// Delete category/subcategory
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteCategory
);

module.exports = router;