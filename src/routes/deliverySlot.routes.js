const express = require("express");

const router = express.Router();

const {
  getDeliverySlots,
  getDeliverySlotsByDay,
  createDeliverySlot,
  updateDeliverySlot,
  deleteDeliverySlot,
} = require("../controllers/deliverySlot.controller");

// Get all slots
router.get("/", getDeliverySlots);

// Get active slots for a specific day
// 0 = Sunday
// 1 = Monday
// ...
// 6 = Saturday
router.get("/day/:dayOfWeek", getDeliverySlotsByDay);

// Create
router.post("/", createDeliverySlot);

// Update
router.put("/:id", updateDeliverySlot);

// Delete
router.delete("/:id", deleteDeliverySlot);

module.exports = router;