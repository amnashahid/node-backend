const PromoCode = require("../models/promoCode.model");

// ==========================================
// GET ALL PROMO CODES
// ==========================================
const getPromoCodes = async (req, res, next) => {
  try {
    const promoCodes = await PromoCode.find()
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: promoCodes.length,
      data: promoCodes,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET ACTIVE PROMO CODES
// ==========================================
const getActivePromoCodes = async (req, res, next) => {
  try {
    const now = new Date();

    const promoCodes = await PromoCode.find({
      isActive: true,
      startDate: {
        $lte: now,
      },
      expiryDate: {
        $gte: now,
      },
      $or: [
        {
          usageLimit: null,
        },
        {
          $expr: {
            $lt: ["$usedCount", "$usageLimit"],
          },
        },
      ],
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: promoCodes.length,
      data: promoCodes,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// GET PROMO CODE BY ID
// ==========================================
const getPromoCodeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    res.status(200).json({
      success: true,
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// CREATE PROMO CODE
// ==========================================
const createPromoCode = async (req, res, next) => {
  try {
    let {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      startDate,
      expiryDate,
      isActive,
    } = req.body;

    // Basic validation
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Promo code is required",
      });
    }

    if (!discountType) {
      return res.status(400).json({
        success: false,
        message: "Discount type is required",
      });
    }

    if (discountValue === undefined || discountValue === null) {
      return res.status(400).json({
        success: false,
        message: "Discount value is required",
      });
    }

    if (!expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Expiry date is required",
      });
    }

  console.log("Creating promo code", req.body);
    code = code.trim().toUpperCase();

    // Check duplicate
    const existingPromoCode = await PromoCode.findOne({
      code,
    });

    if (existingPromoCode) {
      return res.status(409).json({
        success: false,
        message: "Promo code already exists",
      });
    }

    // Validate discount type
    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message:
          "Discount type must be percentage or fixed",
      });
    }

    // Validate percentage
    if (
      discountType === "percentage" &&
      Number(discountValue) > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot be greater than 100",
      });
    }

    console.log("Creating promo code with values:", { 
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      startDate,
      expiryDate,
      isActive,
    });

    const promoCode = await PromoCode.create({
      code,
      description,
      discountType,
      discountValue: Number(discountValue),
      maxDiscount:
        maxDiscount !== undefined &&
        maxDiscount !== null &&
        maxDiscount !== ""
          ? Number(maxDiscount)
          : null,
      minOrderAmount:
        minOrderAmount !== undefined &&
        minOrderAmount !== null &&
        minOrderAmount !== ""
          ? Number(minOrderAmount)
          : 0,
      usageLimit:
        usageLimit !== undefined &&
        usageLimit !== null &&
        usageLimit !== ""
          ? Number(usageLimit)
          : null,
      startDate: startDate || new Date(),
      expiryDate,
      isActive:
        isActive !== undefined
          ? Boolean(isActive)
          : true,
    });

    res.status(201).json({
      success: true,
      message: "Promo code created successfully",
      data: promoCode,
    });
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// ==========================================
// UPDATE PROMO CODE
// ==========================================
const updatePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    let {
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minOrderAmount,
      usageLimit,
      startDate,
      expiryDate,
      isActive,
    } = req.body;

    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    // Check duplicate code
    if (code) {
      code = code.trim().toUpperCase();

      const existingPromoCode = await PromoCode.findOne({
        code,
        _id: {
          $ne: id,
        },
      });

      if (existingPromoCode) {
        return res.status(409).json({
          success: false,
          message: "Promo code already exists",
        });
      }

      promoCode.code = code;
    }

    if (description !== undefined) {
      promoCode.description = description;
    }

    if (discountType !== undefined) {
      if (
        !["percentage", "fixed"].includes(discountType)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Discount type must be percentage or fixed",
        });
      }

      promoCode.discountType = discountType;
    }

    if (discountValue !== undefined) {
      promoCode.discountValue = Number(discountValue);
    }

    if (maxDiscount !== undefined) {
      promoCode.maxDiscount =
        maxDiscount === null || maxDiscount === ""
          ? null
          : Number(maxDiscount);
    }

    if (minOrderAmount !== undefined) {
      promoCode.minOrderAmount = Number(minOrderAmount);
    }

    if (usageLimit !== undefined) {
      promoCode.usageLimit =
        usageLimit === null || usageLimit === ""
          ? null
          : Number(usageLimit);
    }

    if (startDate !== undefined) {
      promoCode.startDate = startDate;
    }

    if (expiryDate !== undefined) {
      promoCode.expiryDate = expiryDate;
    }

    if (isActive !== undefined) {
      promoCode.isActive = Boolean(isActive);
    }

    // Validate percentage
    if (
      promoCode.discountType === "percentage" &&
      promoCode.discountValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot be greater than 100",
      });
    }

    if (
      promoCode.expiryDate <= promoCode.startDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Expiry date must be after start date",
      });
    }

    await promoCode.save();

    res.status(200).json({
      success: true,
      message: "Promo code updated successfully",
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// DELETE PROMO CODE
// ==========================================
const deletePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    await PromoCode.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Promo code deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// VALIDATE PROMO CODE
// ==========================================
const validatePromoCode = async (req, res, next) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Promo code is required",
      });
    }

    if (
      orderAmount === undefined ||
      orderAmount === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Order amount is required",
      });
    }

    const amount = Number(orderAmount);

    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order amount",
      });
    }

    const promoCode = await PromoCode.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Invalid promo code",
      });
    }

    const now = new Date();

    // Check active
    if (!promoCode.isActive) {
      return res.status(400).json({
        success: false,
        message: "This promo code is inactive",
      });
    }

    // Check start date
    if (now < promoCode.startDate) {
      return res.status(400).json({
        success: false,
        message: "This promo code is not active yet",
      });
    }

    // Check expiry
    if (now > promoCode.expiryDate) {
      return res.status(400).json({
        success: false,
        message: "This promo code has expired",
      });
    }

    // Check usage limit
    if (
      promoCode.usageLimit !== null &&
      promoCode.usedCount >= promoCode.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "This promo code has reached its usage limit",
      });
    }

    // Check minimum order
    if (amount < promoCode.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ${promoCode.minOrderAmount}`,
      });
    }

    // Calculate discount
    let discountAmount = 0;

    if (promoCode.discountType === "percentage") {
      discountAmount =
        (amount * promoCode.discountValue) / 100;

      // Apply maximum discount
      if (
        promoCode.maxDiscount !== null &&
        discountAmount > promoCode.maxDiscount
      ) {
        discountAmount = promoCode.maxDiscount;
      }
    } else {
      discountAmount = promoCode.discountValue;

      // Never discount more than order amount
      if (discountAmount > amount) {
        discountAmount = amount;
      }
    }

    const finalAmount = amount - discountAmount;

    res.status(200).json({
      success: true,
      message: "Promo code applied successfully",
      data: {
        promoCode: promoCode.code,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue,
        discountAmount,
        orderAmount: amount,
        finalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// INCREMENT PROMO CODE USAGE
// ==========================================
const usePromoCode = async (req, res, next) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findById(id);

    if (!promoCode) {
      return res.status(404).json({
        success: false,
        message: "Promo code not found",
      });
    }

    // Check usage limit
    if (
      promoCode.usageLimit !== null &&
      promoCode.usedCount >= promoCode.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "Promo code usage limit reached",
      });
    }

    promoCode.usedCount += 1;

    await promoCode.save();

    res.status(200).json({
      success: true,
      message: "Promo code usage updated successfully",
      data: promoCode,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPromoCodes,
  getActivePromoCodes,
  getPromoCodeById,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  validatePromoCode,
  usePromoCode,
};