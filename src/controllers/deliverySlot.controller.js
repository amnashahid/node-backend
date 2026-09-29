
const DeliverySlot = require("../models/deliverySlot.model");

const DAYS = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

const isValidTime = (time) => {
  if (typeof time !== "string") {
    return false;
  }

  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
};

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const validateSlot = (dayOfWeek, startTime, endTime) => {
  if (
    dayOfWeek === undefined ||
    dayOfWeek === null ||
    dayOfWeek === ""
  ) {
    return "Day of week is required";
  }

  const day = Number(dayOfWeek);

  if (!Number.isInteger(day) || day < 0 || day > 6) {
    return "Invalid day of week";
  }

  if (!isValidTime(startTime)) {
    return "Invalid start time. Use HH:mm format";
  }

  if (!isValidTime(endTime)) {
    return "Invalid end time. Use HH:mm format";
  }

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (end <= start) {
    return "End time must be greater than start time";
  }

  return null;
};

const checkOverlap = async (
  dayOfWeek,
  startTime,
  endTime,
  excludeId = null
) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  const slots = await DeliverySlot.find({
    dayOfWeek: Number(dayOfWeek),
    ...(excludeId
      ? {
          _id: {
            $ne: excludeId,
          },
        }
      : {}),
  });

  for (const slot of slots) {
    const existingStart = timeToMinutes(slot.startTime);
    const existingEnd = timeToMinutes(slot.endTime);

    // Overlap condition:
    // newStart < existingEnd && newEnd > existingStart

    if (
      start < existingEnd &&
      end > existingStart
    ) {
      return slot;
    }
  }

  return null;
};

// GET /api/delivery-slots
const getDeliverySlots = async (req, res, next) => {
  try {
    const slots = await DeliverySlot.find()
      .sort({
        dayOfWeek: 1,
        startTime: 1,
      });

    res.status(200).json({
      success: true,
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/delivery-slots/day/:dayOfWeek
const getDeliverySlotsByDay = async (req, res, next) => {
  try {
    const dayOfWeek = Number(req.params.dayOfWeek);

    if (
      !Number.isInteger(dayOfWeek) ||
      dayOfWeek < 0 ||
      dayOfWeek > 6
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid day of week",
      });
    }

    const slots = await DeliverySlot.find({
      dayOfWeek,
      isActive: true,
    }).sort({
      startTime: 1,
    });

    res.status(200).json({
      success: true,
      day: DAYS[dayOfWeek],
      count: slots.length,
      data: slots,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/delivery-slots
const createDeliverySlot = async (req, res, next) => {
  try {
    const {
      dayOfWeek,
      startTime,
      endTime,
      isActive = true,
    } = req.body;

    const validationError = validateSlot(
      dayOfWeek,
      startTime,
      endTime
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const overlappingSlot = await checkOverlap(
      dayOfWeek,
      startTime,
      endTime
    );

    if (overlappingSlot) {
      return res.status(400).json({
        success: false,
        message: `Delivery slot overlaps with ${overlappingSlot.startTime} - ${overlappingSlot.endTime}`,
      });
    }

    const slot = await DeliverySlot.create({
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Delivery slot created successfully",
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/delivery-slots/:id
const updateDeliverySlot = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      dayOfWeek,
      startTime,
      endTime,
      isActive,
    } = req.body;

    const validationError = validateSlot(
      dayOfWeek,
      startTime,
      endTime
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const slot = await DeliverySlot.findById(id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Delivery slot not found",
      });
    }

    const overlappingSlot = await checkOverlap(
      dayOfWeek,
      startTime,
      endTime,
      id
    );

    if (overlappingSlot) {
      return res.status(400).json({
        success: false,
        message: `Delivery slot overlaps with ${overlappingSlot.startTime} - ${overlappingSlot.endTime}`,
      });
    }

    slot.dayOfWeek = Number(dayOfWeek);
    slot.startTime = startTime;
    slot.endTime = endTime;

    if (typeof isActive === "boolean") {
      slot.isActive = isActive;
    }

    await slot.save();

    res.status(200).json({
      success: true,
      message: "Delivery slot updated successfully",
      data: slot,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/delivery-slots/:id
const deleteDeliverySlot = async (req, res, next) => {
  try {
    const { id } = req.params;

    const slot = await DeliverySlot.findById(id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Delivery slot not found",
      });
    }

    await DeliverySlot.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Delivery slot deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeliverySlots,
  getDeliverySlotsByDay,
  createDeliverySlot,
  updateDeliverySlot,
  deleteDeliverySlot,
};