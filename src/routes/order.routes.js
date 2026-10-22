const express = require("express");

const router = express.Router();

const authenticate = require("../middleware/auth.middleware");
const orderController = require("../controllers/order.controller");

// Create order
router.post(
  "/",
  authenticate,
  orderController.createOrder
);

// Get all orders
router.get(
  "/",
  authenticate,
  orderController.getOrders
);

// Get user's orders
router.get(
  "/user-orders",
  authenticate,
  orderController.getUserOrders
);

// Get current/latest order status for authenticated user
// IMPORTANT: This must be BEFORE /:id
router.get(
  "/current-status",
  authenticate,
  orderController.currentStatus
);

// Get single complete order
router.get(
  "/:id",
  orderController.getOrder
);

// Get order status history
router.get(
  "/:id/workflow",
  orderController.getOrderWorkflow
);

// Update order status
router.put(
  "/:id/status",
  orderController.updateOrderStatus
);
router.get(
  "/current-status",
  authenticate,
  orderController.currentStatus
);

module.exports = router;