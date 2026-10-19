const mongoose = require("mongoose");
const DeliverySlot = require("../models/deliverySlot.model");
const {
  MAX_ADVANCE_DAYS,
  getAvailableSlots,
  getUpcomingSlots,
} = require("../services/delivery.service");

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const editableFields = [
  "label",
  "startTime",
  "endTime",
  "daysOfWeek",
  "minLeadMinutes",
  "sortOrder",
  "isActive",
];

function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, message });
}

function pick(body) {
  return Object.fromEntries(
    editableFields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]])
  );
}

function validate(data) {
  for (const field of ["startTime", "endTime"]) {
    if (data[field] !== undefined && !TIME_PATTERN.test(data[field])) {
      return `${field} must be in 24-hour HH:mm format.`;
    }
  }

  if (data.label !== undefined && typeof data.label !== "string") {
    return "label must be a string.";
  }

  if (
    data.daysOfWeek !== undefined &&
    (!Array.isArray(data.daysOfWeek) ||
      data.daysOfWeek.length === 0 ||
      !data.daysOfWeek.every((day) => Number.isInteger(day) && day >= 0 && day <= 6))
  ) {
    return "daysOfWeek must be a non-empty array of numbers from 0 (Sunday) to 6 (Saturday).";
  }

  for (const field of ["minLeadMinutes", "sortOrder"]) {
    if (
      data[field] !== undefined &&
      (typeof data[field] !== "number" ||
        !Number.isFinite(data[field]) ||
        (field === "minLeadMinutes" && data[field] < 0))
    ) {
      return `${field} must be a valid number${field === "minLeadMinutes" ? " of 0 or more" : ""}.`;
    }
  }

  if (data.isActive !== undefined && typeof data.isActive !== "boolean") {
    return "isActive must be a boolean.";
  }

  return null;
}

function validateRange(startTime, endTime) {
  return startTime < endTime ? null : "endTime must be later than startTime.";
}

// GET /api/delivery-slots/available?days=7
exports.getAvailable = async (req, res, next) => {
  try {
    const days = req.query.days === undefined ? 7 : Number(req.query.days);

    if (!Number.isInteger(days) || days < 1 || days > MAX_ADVANCE_DAYS) {
      return fail(res, `days must be a whole number from 1 to ${MAX_ADVANCE_DAYS}.`);
    }

    return res.json({ success: true, data: await getAvailableSlots(days) });
  } catch (error) {
    return next(error);
  }
};

// GET /api/delivery-slots/upcoming (today, tomorrow, day after tomorrow)
exports.getUpcoming = async (req, res, next) => {
  try {
    return res.json({ success: true, data: await getUpcomingSlots() });
  } catch (error) {
    return next(error);
  }
};

// GET /api/delivery-slots (admin: all slots)
exports.getSlots = async (req, res, next) => {
  try {
    const slots = await DeliverySlot.find().sort({ sortOrder: 1, startTime: 1 });
    return res.json({ success: true, count: slots.length, data: slots });
  } catch (error) {
    return next(error);
  }
};

exports.createSlot = async (req, res, next) => {
  try {
    const data = pick(req.body);

    if (data.startTime === undefined || data.endTime === undefined) {
      return fail(res, "startTime and endTime are required.");
    }

    const message = validate(data) || validateRange(data.startTime, data.endTime);
    if (message) return fail(res, message);

    const slot = await DeliverySlot.create(data);
    return res.status(201).json({
      success: true,
      message: "Delivery slot created successfully.",
      data: slot,
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateSlot = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, "Invalid delivery slot ID.");
    }

    const updates = pick(req.body);
    if (Object.keys(updates).length === 0) {
      return fail(res, "Provide at least one field to update.");
    }

    const slot = await DeliverySlot.findById(req.params.id);
    if (!slot) return fail(res, "Delivery slot not found.", 404);

    const message =
      validate(updates) ||
      validateRange(
        updates.startTime ?? slot.startTime,
        updates.endTime ?? slot.endTime
      );
    if (message) return fail(res, message);

    Object.assign(slot, updates);
    await slot.save();

    return res.json({
      success: true,
      message: "Delivery slot updated successfully.",
      data: slot,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteSlot = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return fail(res, "Invalid delivery slot ID.");
    }

    const slot = await DeliverySlot.findByIdAndDelete(req.params.id);
    if (!slot) return fail(res, "Delivery slot not found.", 404);

    return res.json({
      success: true,
      message: "Delivery slot deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
};
