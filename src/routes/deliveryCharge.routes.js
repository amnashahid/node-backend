const express = require("express");

const router = express.Router();

const {
  getDeliveryCharges,
  getActiveDeliveryCharges,
  getDeliveryCharge,
  createDeliveryCharge,
  updateDeliveryCharge,
  deleteDeliveryCharge,
  calculateDeliveryCharge,
} = require("../controllers/deliveryCharge.controller");


router.get(
  "/",
  getDeliveryCharges
);


router.get(
  "/active",
  getActiveDeliveryCharges
);


router.get(
  "/calculate",
  calculateDeliveryCharge
);


router.get(
  "/:id",
  getDeliveryCharge
);


router.post(
  "/",
  createDeliveryCharge
);


router.put(
  "/:id",
  updateDeliveryCharge
);


router.delete(
  "/:id",
  deleteDeliveryCharge
);


module.exports = router;