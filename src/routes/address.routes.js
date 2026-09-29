const express = require("express");

const router = express.Router();

const {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getUserAddresses,
} = require("../controllers/address.controller");

const authMiddleware = require("../middleware/auth.middleware");

// Get all addresses
router.get(
  "/",
  authMiddleware,
  getMyAddresses
);

// Create address
router.post(
  "/",
  authMiddleware,
  createAddress
);

// Get addresses of a specific user
router.get(
  "/user/:userId",
  authMiddleware,
  getUserAddresses
);

// Get single address
router.get(
  "/:id",
  authMiddleware,
  getAddressById
);

// Update address
router.put(
  "/:id",
  authMiddleware,
  updateAddress
);

// Set default address
router.patch(
  "/:id/default",
  authMiddleware,
  setDefaultAddress
);

// Delete address
router.delete(
  "/:id",
  authMiddleware,
  deleteAddress
);

module.exports = router;