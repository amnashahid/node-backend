const Brand = require("../models/brand.model");

const upload = require("../middleware/upload.middleware");
const fs = require("fs");
const path = require("path");
const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({
      isActive: true,
    }).sort({
      "name.en": 1,
    });

    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands,
    });
  } catch (error) {
    next(error);
  }
};

// const getBrandById = async (req, res, next) => {
//   try {
//     const brand = await Brand.findById(req.params.id);

//     if (!brand || !brand.isActive) {
//       return res.status(404).json({
//         success: false,
//         message: "Brand not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: brand,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
const createBrand = async (req, res, next) => {
  try {
    const { nameEn, nameUr } = req.body;

    if (!nameEn || !nameUr) {
      return res.status(400).json({
        success: false,
        message: "English and Urdu brand names are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Brand image is required",
      });
    }

    const existingBrand = await Brand.findOne({
      $or: [
        { "name.en": nameEn.trim() },
        { "name.ur": nameUr.trim() },
      ],
    });

    if (existingBrand) {
      return res.status(409).json({
        success: false,
        message: "Brand already exists",
      });
    }

    const imageUrl =
      `/uploads/${req.file.filename}`;

    const brand = await Brand.create({
      name: {
        en: nameEn.trim(),
        ur: nameUr.trim(),
      },
      image: imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};

const updateBrand = async (req, res, next) => {
  try {
    const { nameEn, nameUr, isActive } = req.body;

    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    if (nameEn) {
      brand.name.en = nameEn.trim();
    }

    if (nameUr) {
      brand.name.ur = nameUr.trim();
    }

    if (isActive !== undefined) {
      brand.isActive =
        isActive === "true" || isActive === true;
    }

    // Replace image if a new one was uploaded
    if (req.file) {
      deleteImage(brand.image);

      brand.image =
        `/uploads/${req.file.filename}`;
    }

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    next(error);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    brand.isActive = false;

    await brand.save();

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const deleteImage = (imageUrl) => {
  if (!imageUrl) return;

  const relativePath = imageUrl.replace(
    "src/uploads/",
    ""
  );

  const filePath = path.join(
    process.cwd(),
    "uploads",
    relativePath
  );

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

 module.exports = {
  getBrands,
  // getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};