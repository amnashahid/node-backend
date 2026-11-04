const express = require("express");
const router = express.Router();

const {
  createGoat,
  getGoats,
  getGoatById,
  updateGoat,
  updateDewormingDate,
  updateGoatStatus,
  deleteGoat
} = require("../controllers/goat.controller");

router.post("/", createGoat);
router.get("/", getGoats);
router.get("/:id", getGoatById);
router.put("/:id", updateGoat);
router.patch("/:id/deworming-date", updateDewormingDate);
router.patch("/:id/status", updateGoatStatus);
router.delete("/:id", deleteGoat);

module.exports = router;