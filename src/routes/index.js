const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API routes are running"
  });
});



const authRoutes =  require("./auth.routes");
const brandRoutes = require("./brand.routes");
const storeSettingsRoutes = require("./storeSettings.routes");



router.use("/auth",  authRoutes );
router.use("/brands", brandRoutes);
router.use("/store-settings", storeSettingsRoutes);
  
module.exports = router;