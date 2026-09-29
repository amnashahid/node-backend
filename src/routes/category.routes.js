const express = require("express");

const router = express.Router();

const {
  createCategory,
  getCategories,
  getMainCategories,
  getSubCategories,
  getCategoryById,
  updateCategory,
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