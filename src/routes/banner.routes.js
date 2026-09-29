const express = require("express");

const router = express.Router();

const {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} = require("../controllers/banner.controller");

const uploadBanner = require("../middleware/bannerUpload.middleware");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ============================================
// Public
// ============================================

router.get("/", getBanners);

router.get(
  "/:id",
  getBannerById
);

// ============================================
// Admin
// ============================================

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  uploadBanner.single("image"),
  createBanner
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  uploadBanner.single("image"),
  updateBanner
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteBanner
);

module.exports = router;