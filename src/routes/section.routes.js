const express = require("express");

const router = express.Router();

const {
  createSection,
  getSections,
  getSectionById,
  updateSection,
  deleteSection,
} = require("../controllers/section.controller");

const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

router.get("/", getSections);

router.get("/:id", getSectionById);

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  createSection   
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  updateSection
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteSection
);

module.exports = router;