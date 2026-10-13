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
const categoryRoutes = require("./category.routes");
const storeSettingsRoutes = require("./storeSettings.routes");
const productRoutes = require("./product.routes");
const bannerRoutes = require("./banner.routes");
const userRoutes = require("./user.routes");


router.use("/auth",  authRoutes );

router.use("/brands", brandRoutes);
router.use("/store-settings", storeSettingsRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/banners", bannerRoutes);
router.use("/users", userRoutes);
  
module.exports = router;