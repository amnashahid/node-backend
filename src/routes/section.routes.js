const express = require("express");
const controller = require("../controllers/section.controller");
const authenticate = require("../middleware/auth.middleware");
const authorizeRoles = require("../middleware/role.middleware");

const router = express.Router();

//router.use(authenticate);

router.get("/", authenticate, controller.getSections);
router.get("/:id", authenticate, controller.getSectionById);
router.post("/", authenticate, authorizeRoles("admin"), 
controller.createSection);
router.put("/:id", authenticate, authorizeRoles("admin"), 
    controller.updateSection);
router.delete("/:id", authorizeRoles("admin"), 
    authenticate,
    controller.deleteSection);

module.exports = router;
