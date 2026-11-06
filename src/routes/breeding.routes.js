const express = require("express");
const router = express.Router();

const {
  createBreeding,
  getBreedings,
  getBreedingById,
  updateBreeding,
  deleteBreeding
} = require("../controllers/breeding.controller");

router.post("/", createBreeding);
router.get("/", getBreedings);
router.get("/:id", getBreedingById);
router.put("/:id", updateBreeding);
router.delete("/:id", deleteBreeding);

module.exports = router;