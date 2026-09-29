const express = require("express");

const router = express.Router();

const {
  getStoreSettings,
  updateStoreSettings,
} = require("../controllers/storeSettings.controller");

// Get settings
router.get("/", getStoreSettings);

// Create / update settings
router.put("/", updateStoreSettings);

module.exports = router;