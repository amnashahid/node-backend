const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const controller = require("../controllers/user.controller");

const router = express.Router();

router.use(authenticate);

router.get("/me", controller.getProfile);
router.put("/me", controller.updateProfile);
router.get("/me/addresses", controller.getAddresses);
router.post("/me/addresses", controller.addAddress);
router.patch("/me/addresses/:addressId", controller.updateAddress);
router.delete("/me/addresses/:addressId", controller.deleteAddress);

module.exports = router;
