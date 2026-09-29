const DeliveryCharge = require("../models/deliveryCharges.model");


// ==========================================
// GET ALL DELIVERY CHARGES
// ==========================================
const getDeliveryCharges = async (req, res, next) => {
  try {
    const charges = await DeliveryCharge.find()
      .sort({
        minDistance: 1,
      });

    res.status(200).json({
      success: true,
      count: charges.length,
      data: charges,
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET ACTIVE DELIVERY CHARGES
// ==========================================
const getActiveDeliveryCharges = async (
  req,
  res,
  next
) => {
  try {
    const charges = await DeliveryCharge.find({
      isActive: true,
    }).sort({
      minDistance: 1,
    });

    res.status(200).json({
      success: true,
      count: charges.length,
      data: charges,
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// GET SINGLE DELIVERY CHARGE
// ==========================================
const getDeliveryCharge = async (
  req,
  res,
  next
) => {
  try {
    const charge =
      await DeliveryCharge.findById(
        req.params.id
      );

    if (!charge) {
      return res.status(404).json({
        success: false,
        message: "Delivery charge not found",
      });
    }

    res.status(200).json({
      success: true,
      data: charge,
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// CHECK OVERLAPPING DISTANCE
// ==========================================
const checkOverlap = async ({
  minDistance,
  maxDistance,
  excludeId = null,
}) => {
  const query = {
    minDistance: {
      $lt: maxDistance,
    },

    maxDistance: {
      $gt: minDistance,
    },
  };

  if (excludeId) {
    query._id = {
      $ne: excludeId,
    };
  }

  return await DeliveryCharge.findOne(query);
};


// ==========================================
// CREATE DELIVERY CHARGE
// ==========================================
const createDeliveryCharge = async (
  req,
  res,
  next
) => {
  try {
    const {
      minDistance,
      maxDistance,
      charge,
      isActive,
    } = req.body;

    const min = Number(minDistance);
    const max = Number(maxDistance);
    const deliveryCharge = Number(charge);


    // Validate minimum distance
    if (
      !Number.isFinite(min) ||
      min < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum distance must be 0 or greater",
      });
    }


    // Validate maximum distance
    if (
      !Number.isFinite(max) ||
      max <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum distance must be greater than 0",
      });
    }


    // Max must be greater than min
    if (max <= min) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum distance must be greater than minimum distance",
      });
    }


    // Validate charge
    if (
      !Number.isFinite(deliveryCharge) ||
      deliveryCharge < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery charge must be 0 or greater",
      });
    }


    // Check overlapping slabs
    const overlapping =
      await checkOverlap({
        minDistance: min,
        maxDistance: max,
      });


    if (overlapping) {
      return res.status(400).json({
        success: false,
        message:
          "This distance range overlaps with an existing delivery charge range",
      });
    }


    const newCharge =
      await DeliveryCharge.create({
        minDistance: min,
        maxDistance: max,
        charge: deliveryCharge,
        isActive: isActive !== false,
      });


    res.status(201).json({
      success: true,
      message:
        "Delivery charge created successfully",
      data: newCharge,
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// UPDATE DELIVERY CHARGE
// ==========================================
const updateDeliveryCharge = async (
  req,
  res,
  next
) => {
  try {
    const {
      minDistance,
      maxDistance,
      charge,
      isActive,
    } = req.body;

    const min = Number(minDistance);
    const max = Number(maxDistance);
    const deliveryCharge = Number(charge);


    if (
      !Number.isFinite(min) ||
      min < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum distance must be 0 or greater",
      });
    }


    if (
      !Number.isFinite(max) ||
      max <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum distance must be greater than 0",
      });
    }


    if (max <= min) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum distance must be greater than minimum distance",
      });
    }


    if (
      !Number.isFinite(deliveryCharge) ||
      deliveryCharge < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery charge must be 0 or greater",
      });
    }


    // Check overlapping ranges
    const overlapping =
      await checkOverlap({
        minDistance: min,
        maxDistance: max,
        excludeId: req.params.id,
      });


    if (overlapping) {
      return res.status(400).json({
        success: false,
        message:
          "This distance range overlaps with an existing delivery charge range",
      });
    }


    const updated =
      await DeliveryCharge.findByIdAndUpdate(
        req.params.id,
        {
          minDistance: min,
          maxDistance: max,
          charge: deliveryCharge,
          isActive: isActive !== false,
        },
        {
          new: true,
          runValidators: true,
        }
      );


    if (!updated) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery charge not found",
      });
    }


    res.status(200).json({
      success: true,
      message:
        "Delivery charge updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// DELETE DELIVERY CHARGE
// ==========================================
const deleteDeliveryCharge = async (
  req,
  res,
  next
) => {
  try {
    const deleted =
      await DeliveryCharge.findByIdAndDelete(
        req.params.id
      );


    if (!deleted) {
      return res.status(404).json({
        success: false,
        message:
          "Delivery charge not found",
      });
    }


    res.status(200).json({
      success: true,
      message:
        "Delivery charge deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// CALCULATE DELIVERY CHARGE
// ==========================================
const calculateDeliveryCharge = async (
  req,
  res,
  next
) => {
  try {
    const distance = Number(
      req.query.distance
    );


    if (
      !Number.isFinite(distance) ||
      distance < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid distance is required",
      });
    }


    const deliveryCharge =
      await DeliveryCharge.findOne({
        minDistance: {
          $lte: distance,
        },

        maxDistance: {
          $gte: distance,
        },

        isActive: true,
      });


    if (!deliveryCharge) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery is not available at this distance",
      });
    }


    res.status(200).json({
      success: true,

      data: {
        distance,

        minDistance:
          deliveryCharge.minDistance,

        maxDistance:
          deliveryCharge.maxDistance,

        charge:
          deliveryCharge.charge,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getDeliveryCharges,
  getActiveDeliveryCharges,
  getDeliveryCharge,
  createDeliveryCharge,
  updateDeliveryCharge,
  deleteDeliveryCharge,
  calculateDeliveryCharge,
};