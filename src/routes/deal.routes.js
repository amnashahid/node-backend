const express = require("express");
const controller = require("../controllers/deal.controller");
const uploadDealImage = require("../middleware/dealUpload.middleware");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", controller.getDeals);
router.get("/:id", controller.getDealById);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  uploadDealImage.single("image"),
  controller.createDeal
);
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  uploadDealImage.single("image"),
  controller.updateDeal
);
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  controller.deleteDeal
);

module.exports = router;
