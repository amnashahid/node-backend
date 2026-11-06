const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductByCategory,
  getProductByBrand
} = require("../controllers/product.controller");

const uploadProductImage = require("../middleware/productUpload.middleware");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// Customer/public viewing
router.get("/", getProducts);
router.get("/:id", getProductById);
router.get("/category/:categoryId", getProductByCategory);
router.get("/brand/:brandId", getProductByBrand);

// Admin
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  uploadProductImage.single("image"),
  createProduct
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  uploadProductImage.single("image"),
  updateProduct
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteProduct
);

module.exports = router;    