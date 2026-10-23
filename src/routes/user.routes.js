const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const controller = require("../controllers/user.controller");

const router = express.Router();

router.use(authenticate);

router.get("/me", authenticate, controller.getProfile);
router.put("/me", authenticate, controller.updateProfile);
router.get("/me/addresses", authenticate, controller.getAddresses);
router.post("/me/addresses", authenticate,   controller.addAddress);
router.patch("/me/addresses/:addressId", authenticate, controller.updateAddress);
router.delete("/me/addresses/:addressId", authenticate, controller.deleteAddress);

module.exports = router;
