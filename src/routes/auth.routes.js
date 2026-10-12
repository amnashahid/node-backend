const express = require("express");
const controller = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/send-otp", controller.sendOtp);
router.post("/verify-otp", controller.verifyOtp);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);
router.get("/me", authenticate, controller.me);
router.post("/admin-login", controller.adminLogin);
router.put("/complete-profile", authenticate, controller.completeProfile);

module.exports = router;