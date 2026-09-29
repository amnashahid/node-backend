const express = require("express");

const router = express.Router();

const {
  getUsers,
  getAdmins,
  getCustomers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

// All users
router.get("/", getUsers);

// Admins
router.get("/admins", getAdmins);

// Customers
router.get("/customers", getCustomers);

// Single user
router.get("/:id", getUserById);

// Create
router.post("/", createUser);

// Update
router.put("/:id", updateUser);

// Delete
router.delete("/:id", deleteUser);

module.exports = router;