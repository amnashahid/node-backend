const express = require("express");

const {
  getPromoCodes,
  getActivePromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
  usePromoCode,
} = require("../controllers/promoCode.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

const router = express.Router();

// ==========================================
// PUBLIC / CUSTOMER ROUTES
// ==========================================

// Get active promo codes
router.get("/active", getActivePromoCodes);

// Validate promo code
router.post("/validate", validatePromoCode);

// ==========================================
// ADMIN ROUTES
// ==========================================

// Get all promo codes
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getPromoCodes
);

// Get promo code by ID
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getPromoCodeById
);

// Create promo code
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createPromoCode
);

// Update promo code
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updatePromoCode
);

// Delete promo code
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deletePromoCode
);

// Increment usage
router.post(
  "/:id/use",
  authMiddleware,
  roleMiddleware("admin"),
  usePromoCode
);

module.exports = router;