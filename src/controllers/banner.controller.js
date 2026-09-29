const Banner = require("../models/banner.model");
const fs = require("fs");
const path = require("path");

// ============================================
// CREATE BANNER
// ============================================

const createBanner = async (req, res, next) => {
  try {
    const {
      index,
      isActive,
      title,
      link,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    if (!index) {
      return res.status(400).json({
        success: false,
        message: "Banner index is required",
      });
    }

    const bannerIndex = Number(index);

    if (
      !Number.isInteger(bannerIndex) ||
      bannerIndex < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Index must be a positive integer",
      });
    }

    // Check whether this position is already used
    const existingBanner =
      await Banner.findOne({
        index: bannerIndex,
      });

    if (existingBanner) {
      return res.status(400).json({
        success: false,
        message:
          `Banner index ${bannerIndex} is already in use`,
      });
    }

    const image =
      `/uploads/banners/${req.file.filename}`;

    const banner = await Banner.create({
      image,
      index: bannerIndex,

      isActive:
        isActive === undefined
          ? true
          : isActive === true ||
            isActive === "true",

      title: title || "",
      link: link || "",
    });

    return res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET ALL BANNERS
// ============================================

const getBanners = async (req, res, next) => {
  try {
    const {
      isActive,
    } = req.query;

    const filter = {};

    if (isActive !== undefined) {
      filter.isActive =
        isActive === "true";
    }

    const banners =
      await Banner.find(filter)
        .sort({
          index: 1,
        });

    return res.status(200).json({
      success: true,
      count: banners.length,
      data: banners,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET SINGLE BANNER
// ============================================

const getBannerById = async (
  req,
  res,
  next
) => {
  try {
    const banner =
      await Banner.findById(
        req.params.id
      );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// UPDATE BANNER
// ============================================

const updateBanner = async (
  req,
  res,
  next
) => {
  try {
    const banner =
      await Banner.findById(
        req.params.id
      );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    const {
      index,
      isActive,
      title,
      link,
    } = req.body;

    // -----------------------------
    // Validate index
    // -----------------------------

    let newIndex = banner.index;

    if (index !== undefined) {
      newIndex = Number(index);

      if (
        !Number.isInteger(newIndex) ||
        newIndex < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Index must be a positive integer",
        });
      }

      // Check if another banner uses it
      const existingBanner =
        await Banner.findOne({
          index: newIndex,
          _id: {
            $ne: banner._id,
          },
        });

      if (existingBanner) {
        return res.status(400).json({
          success: false,
          message:
            `Banner index ${newIndex} is already in use`,
        });
      }

      banner.index = newIndex;
    }

    // -----------------------------
    // Other fields
    // -----------------------------

    if (isActive !== undefined) {
      banner.isActive =
        isActive === true ||
        isActive === "true";
    }

    if (title !== undefined) {
      banner.title = title;
    }

    if (link !== undefined) {
      banner.link = link;
    }

    // -----------------------------
    // Replace image
    // -----------------------------

    if (req.file) {
      const oldImage =
        banner.image;

      banner.image =
        `/uploads/banners/${req.file.filename}`;

      // Delete old image
      if (oldImage) {
        const oldImagePath =
          path.join(
            process.cwd(),
            "public",
            oldImage
          );

        if (
          fs.existsSync(oldImagePath)
        ) {
          fs.unlinkSync(
            oldImagePath
          );
        }
      }
    }

    await banner.save();

    return res.status(200).json({
      success: true,
      message:
        "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// DELETE BANNER
// ============================================

const deleteBanner = async (
  req,
  res,
  next
) => {
  try {
    const banner =
      await Banner.findById(
        req.params.id
      );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Delete image
    if (banner.image) {
      const imagePath =
        path.join(
          process.cwd(),
          "public",
          banner.image
        );

      if (
        fs.existsSync(imagePath)
      ) {
        fs.unlinkSync(
          imagePath
        );
      }
    }

    await Banner.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Banner deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
};