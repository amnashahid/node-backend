const mongoose = require("mongoose");
const User = require("../models/User");

async function requireAdmin(req, res, next) {
  try {
    // Ensure the user is authenticated
    const userId = req.user?.userId;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Find the authenticated user
    const user = await User.findById(userId)
      .select("role isActive")
      .lean();

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account is unavailable.",
      });
    }

    // Allow admins only
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    return next();
  } catch (error) {
    console.error("requireAdmin error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to authorize request.",
    });
  }
}

module.exports = requireAdmin;