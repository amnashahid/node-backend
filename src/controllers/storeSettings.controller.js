const StoreSettings = require("../models/storeSettings.model");

// ============================================
// GET STORE SETTINGS
// ============================================

const getStoreSettings = async (req, res, next) => {
  try {
    let settings = await StoreSettings.findOne();

    // Create default settings if none exists
    if (!settings) {
      settings = await StoreSettings.create({
        storeName: "My Grocery Store",
        storeNotes: "",
        latitude: 0,
        longitude: 0,
        radius: 1,
        radiusUnit: "km",
        isActive: true,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...settings.toObject(),
        StoreName: settings.storeName,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CREATE / UPDATE STORE SETTINGS
// ============================================

const updateStoreSettings = async (req, res, next) => {
  try {
    const {
      storeName,
      StoreName,
      storeNotes,
      latitude,
      longitude,
      radius,
      radiusUnit,
      isActive,
    } = req.body;

    const resolvedStoreName = storeName || StoreName;

    // ================================
    // VALIDATION
    // ================================

    if (!resolvedStoreName || !resolvedStoreName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Store name is required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const radiusValue = Number(radius);

    if (!Number.isFinite(lat)) {
      return res.status(400).json({
        success: false,
        message: "Valid latitude is required",
      });
    }

    if (!Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        message: "Valid longitude is required",
      });
    }

    if (!Number.isFinite(radiusValue) || radiusValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid radius is required",
      });
    }

    // Latitude range
    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message:
          "Latitude must be between -90 and 90",
      });
    }

    // Longitude range
    if (lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message:
          "Longitude must be between -180 and 180",
      });
    }

    // ================================
    // UPDATE EXISTING SETTINGS
    // ================================

    let settings = await StoreSettings.findOne();

    if (settings) {
      settings.storeName = resolvedStoreName.trim();
      settings.storeNotes = storeNotes || "";
      settings.latitude = lat;
      settings.longitude = lng;
      settings.radius = radiusValue;
      settings.radiusUnit = radiusUnit || "km";

      if (typeof isActive === "boolean") {
        settings.isActive = isActive;
      }

      await settings.save();
    } else {
      // ================================
      // CREATE SETTINGS
      // ================================

      settings = await StoreSettings.create({
        storeName: resolvedStoreName.trim(),
        storeNotes: storeNotes || "",
        latitude: lat,
        longitude: lng,
        radius: radiusValue,
        radiusUnit: radiusUnit || "km",
        isActive:
          typeof isActive === "boolean"
            ? isActive
            : true,
      });
    }

    res.status(200).json({
      success: true,
      message: "Store settings saved successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStoreSettings,
  updateStoreSettings,
};