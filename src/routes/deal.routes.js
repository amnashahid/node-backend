const express = require("express");

const router = express.Router();

const {
  createDeal,
  getDeals,
  getDealById,
  updateDeal,
  deleteDeal,
} = require("../controllers/deal.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.get("/", getDeals);

router.get("/:id", getDealById);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createDeal
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateDeal
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteDeal
);

module.exports = router;