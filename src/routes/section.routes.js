const express = require("express");
const controller = require("../controllers/section.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

//router.use(authenticate);

router.get("/", controller.getSections);
router.get("/:id", controller.getSectionById);
router.post("/", //authorizeRoles("admin"), 
controller.createSection);
router.put("/:id", //authorizeRoles("admin"), 
    controller.updateSection);
router.delete("/:id", //authorizeRoles("admin"), 
    controller.deleteSection);

module.exports = router;
