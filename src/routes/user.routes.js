const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const controller = require("../controllers/user.controller");

const router = express.Router();


router.get("/me", authMiddleware, controller.getProfile);
router.put("/me", authMiddleware, controller.updateProfile);
router.get("/me/addresses", authMiddleware, controller.getAddresses);
router.post("/me/addresses", authMiddleware, controller.addAddress);
router.put("/me/addresses/:addressId", authMiddleware, controller.updateAddress);
router.delete("/me/addresses/:addressId", authMiddleware, controller.deleteAddress);

module.exports = router;
