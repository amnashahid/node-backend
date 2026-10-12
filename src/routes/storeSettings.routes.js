
const express = require("express");
const router = express.Router();

const controller = require("../controllers/storeSettings.controller");
const authenticate = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/requireAdmin.middleware");

router.get("/", controller.getPublicSettings);

router.get(
  "/",
//   authenticate,
//   requireAdmin,
  controller.getAdminSettings
);

router.put(
  "/admin",
//   authenticate,
//   requireAdmin,
  controller.upsertSettings
);

module.exports = router;
