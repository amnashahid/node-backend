
const Ad = require("../models/Ad.model");

// GET /api/ads
// Get all active ads for the mobile app
exports.getAds = async (req, res, next) => {
  try {
    const ads = await Ad.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/ads/:id
// Get a single active ad
exports.getAdById = async (req, res, next) => {
  try {
    const ad = await Ad.findOne({
      _id: req.params.id,
      isActive: true,
    }).lean();

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: ad,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ad ID",
      });
    }

    next(error);
  }
};

// POST /api/ads
// Create a new ad
exports.createAd = async (req, res, next) => {
  try {
    const { title, description, imageUrl, isActive } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    if (
      imageUrl != null &&
      (typeof imageUrl !== "string" ||
        !/^https?:\/\/\S+$/i.test(imageUrl.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Image URL must be a valid HTTP or HTTPS URL",
      });
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const ad = await Ad.create({
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl?.trim() || null,
      ...(isActive !== undefined && { isActive }),
    });

    return res.status(201).json({
      success: true,
      message: "Ad created successfully",
      data: ad,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};

// PUT /api/ads/:id
// Update an existing ad
exports.updateAd = async (req, res, next) => {
  try {
    const { title, description, imageUrl, isActive } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string" || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }
      updates.description = description.trim();
    }

    if (imageUrl !== undefined) {
      if (
        imageUrl !== null &&
        (typeof imageUrl !== "string" ||
          !/^https?:\/\/\S+$/i.test(imageUrl.trim()))
      ) {
        return res.status(400).json({
          success: false,
          message: "Image URL must be a valid HTTP or HTTPS URL, or null",
        });
      }

      updates.imageUrl =
        imageUrl === null || !imageUrl.trim()
          ? null
          : imageUrl.trim();
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean",
        });
      }
      updates.isActive = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update",
      });
    }

    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ad updated successfully",
      data: ad,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ad ID",
      });
    }

    next(error);
  }
};

// DELETE /api/ads/:id
// Delete an ad permanently
exports.deleteAd = async (req, res, next) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid ad ID",
      });
    }

    next(error);
  }
};
