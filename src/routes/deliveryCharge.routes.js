const express = require("express");
const controller = require("../controllers/deliveryCharge.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", controller.getConfig);
router.post("/calculate", controller.calculate);
router.put("/", authenticate, authorizeRoles("admin"), controller.upsertConfig);

module.exports = router;
