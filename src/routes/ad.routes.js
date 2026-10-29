
const express = require("express");
const router = express.Router();

const adController = require("../controllers/adController");

// Replace these imports with your existing middleware paths.
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Public endpoints for the mobile app
router.get("/", adController.getAds);
router.get("/:id", adController.getAdById);

// Admin-only endpoints
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  adController.createAd
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  adController.updateAd
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  adController.deleteAd
);

module.exports = router;
