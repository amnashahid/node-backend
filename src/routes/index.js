const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API routes are running"
  });
});


//AUTH

const authRoutes =  require("./auth.routes");
const brandRoutes = require("./brand.routes");
const categoryRoutes = require("./category.routes");
const productRoutes = require("./product.routes");
const bannerRoutes = require("./banner.routes");
const dealRoutes = require("./deal.routes");
const userRoutes = require("./user.routes");
const storeSettingsRoutes = require("./storeSettings.routes");
const deliveryChargeRoutes = require("./deliveryCharge.routes");
const deliverySlotRoutes = require("./deliverySlot.routes");
const addressRoutes = require("./address.routes");
const orderRoutes = require("./order.routes");
router.use("/auth",  authRoutes );
router.use("/brands", brandRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/banners", bannerRoutes);
router.use("/deals", dealRoutes);
router.use("/users", userRoutes);
router.use("/store-settings", storeSettingsRoutes);
router.use("/delivery-charges", deliveryChargeRoutes);
router.use("/delivery-slots", deliverySlotRoutes);
router.use("/addresses", addressRoutes);
router.use("/orders", orderRoutes);
router.use("/sections", require("./section.routes"));

  
module.exports = router;