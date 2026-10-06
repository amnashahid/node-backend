const express = require("express");

const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderTimeline,
  deleteOrder,
} = require("../controllers/order.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// ============================================================
// CUSTOMER
// ============================================================

// Create order
router.post(
  "/",
  authMiddleware,
  createOrder
);

// Get logged-in customer's orders
router.get(
  "/my",
  authMiddleware,
  getMyOrders
);

// Get logged-in customer's order
router.get(
  "/my/:id",
  authMiddleware,
  getMyOrderById
);

// ============================================================
// ADMIN
// ============================================================

// Get all orders
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getAllOrders
);

// Get order details
router.get(
  "/:orderId",
  authMiddleware,
  roleMiddleware("admin"),
  getOrderById
);

// Update order status
router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("admin"),
  updateOrderStatus
);

// Get timeline
router.get(
  "/:id/timeline",
  authMiddleware,
  roleMiddleware("admin"),
  getOrderTimeline
);

// Delete order
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteOrder
);


module.exports = router;