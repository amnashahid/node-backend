const express = require("express");

const router = express.Router();

const {createBrand, getBrands, updateBrand, deleteBrand} = require("../controllers/brand.controller");

const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

 const {
  uploadBrandImage,
} = require("../middleware/upload.middleware");

router.get(
  "/",
  authenticate,
  getBrands
);


router.post(
  "/",
  authenticate,
//   authorize("admin"),
  uploadBrandImage.single("image"),
  createBrand
);

// router.get(
//   "/:id",
//   authenticate,
//   brandController.getBrandById
// );
router.put(
  "/:id",
  authenticate,
 // authorize("admin"),
  uploadBrandImage.single("image"),
  updateBrand
);
router.delete(
  "/:id",
  authenticate,
  //authorize("admin"),
  deleteBrand
);

 module.exports = router;