const express = require("express");
const controller = require("../controllers/deliverySlot.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/available", authenticate,controller.getAvailable);
router.get("/upcoming", authenticate, controller.getUpcoming);

router.get("/", authenticate, authorizeRoles("admin"), controller.getSlots);
router.post("/", authenticate, authorizeRoles("admin"), controller.createSlot);
router.put("/:id", authenticate, authorizeRoles("admin"), controller.updateSlot);
router.delete("/:id", authenticate, authorizeRoles("admin"), controller.deleteSlot);

module.exports = router;
