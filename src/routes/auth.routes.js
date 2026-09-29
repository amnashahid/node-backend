// src/routes/auth.routes.js

const express = require("express");

const {
    register,
    verifyPhoneOtp,
    completeProfile,
    adminLogin
} = require("../controllers/auth.controller");

const authMiddleware =
    require("../middleware/auth.middleware");

const router = express.Router();

router.post(
    "/register",
    register
);

router.post(
    "/verify-otp",
    verifyPhoneOtp
);

router.post(
    "/complete-profile",
    authMiddleware,
    completeProfile
);

router.post(
    "/admin-login",
    adminLogin
);

module.exports = router;