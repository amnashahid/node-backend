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
const dealRoutes = require("./deal.routes");
const sectionRoutes = require("./section.routes");
const deliverySlotRoutes = require("./deliverySlot.routes");
const deliveryChargeRoutes = require("./deliveryCharge.routes");


router.use("/auth",  authRoutes );

router.use("/brands", brandRoutes);
router.use("/store-settings", storeSettingsRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/banners", bannerRoutes);
router.use("/users", userRoutes);
router.use("/deals", dealRoutes);
router.use("/sections", sectionRoutes);
router.use("/delivery-slots", deliverySlotRoutes);
router.use("/delivery-charges", deliveryChargeRoutes);
  
module.exports = router;