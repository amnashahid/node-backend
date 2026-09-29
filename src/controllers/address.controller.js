const Address = require("../models/address.model");
const User = require("../models/User");

// ============================================================
// CREATE ADDRESS
// ============================================================

const createAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const {
      label,
      recipientName,
      phone,
      addressLine1,
      addressLine2,
      area,
      city,
      postalCode,
      location,
      latitude,
      longitude,
      deliveryInstructions,
      isDefault,
    } = req.body;

    if (!label) {
      return res.status(400).json({
        success: false,
        message: "Address label is required",
      });
    }

    if (!recipientName) {
      return res.status(400).json({
        success: false,
        message: "Recipient name is required",
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }

    if (!addressLine1) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    // If this address should be default,
    // remove default from existing addresses.
    if (isDefault === true) {
      await Address.updateMany(
        {
          userId,
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    // If this is the user's first address,
    // automatically make it default.
    const addressCount = await Address.countDocuments({
      userId,
      isActive: true,
    });

    const makeDefault =
      addressCount === 0 || isDefault === true;

    const address = await Address.create({
      userId,

      label,
      recipientName,
      phone,

      addressLine1,
      addressLine2: addressLine2 || "",

      area: area || "",
      city: city || "",
      postalCode: postalCode || "",

      location: location || "",

      latitude:
        latitude !== undefined &&
        latitude !== null &&
        latitude !== ""
          ? Number(latitude)
          : null,

      longitude:
        longitude !== undefined &&
        longitude !== null &&
        longitude !== ""
          ? Number(longitude)
          : null,

      deliveryInstructions:
        deliveryInstructions || "",

      isDefault: makeDefault,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET USER ADDRESSES
// ============================================================

const getMyAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const addresses = await Address.find({
      userId,
      isActive: true,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

const getUserAddresses = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const addresses = await User.find({
      userId,
      isActive: true,
    });

    console.log("Fetching addresses for user:", req.params.userId, addresses);
    return res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET SINGLE ADDRESS
// ============================================================

const getAddressById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      userId,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE ADDRESS
// ============================================================

const updateAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      userId,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const {
      label,
      recipientName,
      phone,
      addressLine1,
      addressLine2,
      area,
      city,
      postalCode,
      location,
      latitude,
      longitude,
      deliveryInstructions,
      isDefault,
    } = req.body;

    // If making this address default,
    // remove default from other addresses.
    if (isDefault === true) {
      await Address.updateMany(
        {
          userId,
          _id: { $ne: id },
          isDefault: true,
        },
        {
          $set: {
            isDefault: false,
          },
        }
      );
    }

    if (label !== undefined) {
      address.label = label;
    }

    if (recipientName !== undefined) {
      address.recipientName = recipientName;
    }

    if (phone !== undefined) {
      address.phone = phone;
    }

    if (addressLine1 !== undefined) {
      address.addressLine1 = addressLine1;
    }

    if (addressLine2 !== undefined) {
      address.addressLine2 = addressLine2;
    }

    if (area !== undefined) {
      address.area = area;
    }

    if (city !== undefined) {
      address.city = city;
    }

    if (postalCode !== undefined) {
      address.postalCode = postalCode;
    }

    if (location !== undefined) {
      address.location = location;
    }

    if (latitude !== undefined) {
      address.latitude =
        latitude === "" || latitude === null
          ? null
          : Number(latitude);
    }

    if (longitude !== undefined) {
      address.longitude =
        longitude === "" || longitude === null
          ? null
          : Number(longitude);
    }

    if (deliveryInstructions !== undefined) {
      address.deliveryInstructions =
        deliveryInstructions;
    }

    if (isDefault !== undefined) {
      address.isDefault = Boolean(isDefault);
    }

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// SET DEFAULT ADDRESS
// ============================================================

const setDefaultAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      userId,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // Remove default from all user's addresses
    await Address.updateMany(
      {
        userId,
      },
      {
        $set: {
          isDefault: false,
        },
      }
    );

    // Set selected address as default
    address.isDefault = true;

    await address.save();

    return res.status(200).json({
      success: true,
      message: "Default address changed successfully",
      data: address,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE ADDRESS
// ============================================================

const deleteAddress = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      userId,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;

    // Soft delete
    address.isActive = false;
    address.isDefault = false;

    await address.save();

    // If deleted address was default,
    // automatically select another address.
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        userId,
        isActive: true,
      }).sort({
        createdAt: -1,
      });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAddress,
  getMyAddresses,
  getAddressById,
  updateAddress,
  setDefaultAddress,
  getUserAddresses,
  deleteAddress,
};