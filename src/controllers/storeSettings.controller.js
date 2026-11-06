
const StoreSettings = require("../models/StoreSettings");

const allowedFields = [
  "storeName",
  "storeNotes",
  "lat",
  "lon",
  "currency",
  "defaultDeliveryCharge",
  "minimumOrderAmount",
];

function serializeSettings(settings) {
  if (!settings) return null;

  const data = {};

  for (const field of allowedFields) {
    data[field] = settings[field];
  }

  if (settings._id) data._id = settings._id;
  if (settings.createdAt) data.createdAt = settings.createdAt;
  if (settings.updatedAt) data.updatedAt = settings.updatedAt;

  return data;
}

// GET /api/store-settings
exports.getPublicSettings = async (req, res) => {
  try {
    const settings = await StoreSettings.findOne().lean();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Store settings have not been configured.",
      });
    }

    return res.json({
      success: true,
      data: serializeSettings(settings),
    });
  } catch (error) {
    console.error("getPublicSettings:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch store settings.",
    });
  }
};

// GET /api/store-settings/admin
exports.getAdminSettings = async (req, res) => {
  try {
    const settings = await StoreSettings.findOne().lean();

    return res.json({
      success: true,
      data: serializeSettings(settings),
    });
  } catch (error) {
    console.error("getAdminSettings:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch store settings.",
    });
  }
};

// PUT /api/store-settings/admin
exports.upsertSettings = async (req, res) => {
  try {
    const updates = {};

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, field)
      ) {
        updates[field] = req.body[field];
      }
    }

    if (!updates.storeName || typeof updates.storeName !== "string" ||
        !updates.storeName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Store name is required.",
      });
    }

    if (
      updates.storeNotes !== undefined &&
      typeof updates.storeNotes !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Store notes must be a string.",
      });
    }

    const numericFields = [
      "lat",
      "lon",
      "defaultDeliveryCharge",
      "minimumOrderAmount",
    ];

    for (const field of numericFields) {
      const value = updates[field];

      if (
        value === undefined ||
        value === "" ||
        value === null ||
        typeof value !== "number" ||
        !Number.isFinite(value)
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a valid number.`,
        });
      }
    }

    if (updates.lat < -90 || updates.lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Latitude must be between -90 and 90.",
      });
    }

    if (updates.lon < -180 || updates.lon > 180) {
      return res.status(400).json({
        success: false,
        message: "Longitude must be between -180 and 180.",
      });
    }

    if (
      updates.defaultDeliveryCharge < 0 ||
      updates.minimumOrderAmount < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Charges and minimum order must be 0 or greater.",
      });
    }

    const currency = updates.currency;

    if (
      typeof currency !== "string" ||
      !/^[A-Za-z]{3}$/.test(currency.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Currency must be a three-letter currency code, such as PKR.",
      });
    }

    updates.storeName = updates.storeName.trim();
    updates.currency = currency.trim().toUpperCase();

    if (updates.storeNotes !== undefined) {
      updates.storeNotes = updates.storeNotes.trim();
    }

    // Keep one settings document for this single-store app.
    let settings = await StoreSettings.findOne();

    if (settings) {
      Object.assign(settings, updates);
    } else {
      settings = new StoreSettings(updates);
    }

    await settings.save();

    return res.json({
      success: true,
      message: "Store settings saved successfully.",
      data: serializeSettings(settings.toObject()),
    });
  } catch (error) {
    console.error("upsertSettings:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save store settings.",
    });
  }
};
