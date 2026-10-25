const mongoose = require("mongoose");
const User = require("../models/User");
const Address = require("../models/Address");

const addressLabels = ["HOME", "WORK", "OTHER"];
const profileFields = ["firstName", "lastName", "email", "language"];
const addressFields = [
  "label",
  "addressLine",
  "area",
  "latitude",
  "longitude",
  "isDefault",
];

function getUserId(req) {
  return req.user.userId;
}

function serializeAddress(address) {
  return {
    id: address._id,
    label: address.label,
    addressLine: address.addressLine,
    area: address.area,
    latitude: address.latitude,
    longitude: address.longitude,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

function serializeUser(user, addresses) {
  return {
    id: user._id,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email || "",
    language: user.language,
    profileCompleted: user.profileCompleted,
    role: user.role,
    addresses: addresses.map(serializeAddress),
  };
}

function validCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lon = Number(longitude);

  return (
    latitude !== undefined &&
    latitude !== null &&
    longitude !== undefined &&
    longitude !== null &&
    latitude !== "" &&
    longitude !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function validateAddressFields(body) {
  if (typeof body.addressLine !== "string" || !body.addressLine.trim()) {
    return "A delivery address is required.";
  }

  if (
    body.label !== undefined &&
    !addressLabels.includes(body.label)
  ) {
    return "Label must be HOME, WORK, or OTHER.";
  }

  if (
    body.addressLine !== undefined &&
    (typeof body.addressLine !== "string" || !body.addressLine.trim())
  ) {
    return "Address line must be a non-empty string.";
  }

  if (body.area !== undefined && typeof body.area !== "string") {
    return "Area must be a string.";
  }

  if (!validCoordinates(body.latitude, body.longitude)) {
    return "Valid latitude and longitude are required.";
  }

  if (
    body.isDefault !== undefined &&
    typeof body.isDefault !== "boolean"
  ) {
    return "isDefault must be a boolean.";
  }

  return null;
}

function pickFields(body, fields) {
  return Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
      .map((field) => [field, body[field]])
  );
}

async function makeDefaultAddress(userId, addressId) {
  await Address.updateMany(
    { userId, _id: { $ne: addressId }, isDefault: true },
    { $set: { isDefault: false } }
  );
}

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ _id: getUserId(req), isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const addresses = await Address.find({ userId: user._id }).sort({
      isDefault: -1,
      createdAt: 1,
    });

    return res.json({
      success: true,
      data: { user: serializeUser(user, addresses) },
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    if (Object.prototype.hasOwnProperty.call(req.body, "phone")) {
      return res.status(400).json({
        success: false,
        message: "Phone number cannot be changed.",
      });
    }

    const updates = pickFields(req.body, profileFields);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one profile field to update.",
      });
    }

    for (const field of ["firstName", "lastName"]) {
      if (
        updates[field] !== undefined &&
        (typeof updates[field] !== "string" || !updates[field].trim())
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} must be a non-empty string.`,
        });
      }

      if (updates[field] !== undefined) {
        updates[field] = updates[field].trim();
      }
    }

    if (updates.email !== undefined) {
      if (
        typeof updates.email !== "string" ||
        (updates.email.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email.trim()))
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid email address.",
        });
      }

      updates.email = updates.email.trim().toLowerCase() || undefined;
    }

    if (
      updates.language !== undefined &&
      !["en", "ur"].includes(updates.language)
    ) {
      return res.status(400).json({
        success: false,
        message: "Language must be en or ur.",
      });
    }

    const user = await User.findOne({ _id: getUserId(req), isActive: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    Object.assign(user, updates);
    user.profileCompleted = Boolean(user.firstName && user.lastName);
    await user.save();

    const addresses = await Address.find({ userId: user._id }).sort({
      isDefault: -1,
      createdAt: 1,
    });

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      data: { user: serializeUser(user, addresses) },
    });
  } catch (error) {
    return next(error);
  }
};

exports.getAddresses = async (req, res, next) => {
  console.log("Fetching addresses");
  try {
    const addresses = await Address.find({ userId: getUserId(req) }).sort({
      isDefault: -1,
      createdAt: 1,
    });

    return res.json({
      success: true,
      data: { addresses: addresses.map(serializeAddress) },
    });
  } catch (error) {
    return next(error);
  }
};

exports.addAddress = async (req, res, next) => {
  try {
    const validationError = validateAddressFields(req.body);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const userId = getUserId(req);
    const hasDefaultAddress = await Address.exists({ userId, isDefault: true });
    const addressData = pickFields(req.body, addressFields);
    addressData.label = addressData.label || "HOME";
    addressData.addressLine = addressData.addressLine.trim();
    addressData.area = addressData.area?.trim() || "";
    addressData.latitude = Number(addressData.latitude);
    addressData.longitude = Number(addressData.longitude);
    addressData.isDefault = addressData.isDefault === true || !hasDefaultAddress;

    const address = await Address.create({ ...addressData, userId });

    if (address.isDefault) {
      await makeDefaultAddress(userId, address._id);
    }

    return res.status(201).json({
      success: true,
      message: "Address added successfully.",
      data: { address: serializeAddress(address) },
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateAddress = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID.",
      });
    }

    const updates = pickFields(req.body, addressFields);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one address field to update.",
      });
    }

    const userId = getUserId(req);
    const existingAddress = await Address.findOne({
      _id: req.params.addressId,
      userId,
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const effectiveAddress = {
      ...existingAddress.toObject(),
      ...updates,
    };
    const validationError = validateAddressFields(effectiveAddress);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (updates.addressLine !== undefined) {
      updates.addressLine = updates.addressLine.trim();
    }
    if (updates.area !== undefined) {
      updates.area = updates.area.trim();
    }
    if (updates.latitude !== undefined) {
      updates.latitude = Number(updates.latitude);
    }
    if (updates.longitude !== undefined) {
      updates.longitude = Number(updates.longitude);
    }

    let promoteAddress = null;
    if (existingAddress.isDefault && updates.isDefault === false) {
      promoteAddress = await Address.findOne({
        userId,
        _id: { $ne: existingAddress._id },
      }).sort({ createdAt: 1 });

      if (!promoteAddress) {
        return res.status(400).json({
          success: false,
          message: "The only saved address must remain the default address.",
        });
      }
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.addressId, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    if (address.isDefault) {
      await makeDefaultAddress(userId, address._id);
    }
    if (promoteAddress) {
      promoteAddress.isDefault = true;
      await promoteAddress.save();
    }

    return res.json({
      success: true,
      message: "Address updated successfully.",
      data: { address: serializeAddress(address) },
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.addressId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid address ID.",
      });
    }

    const userId = getUserId(req);
    const address = await Address.findOneAndDelete({
      _id: req.params.addressId,
      userId,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    if (address.isDefault) {
      const nextDefault = await Address.findOne({ userId }).sort({
        createdAt: 1,
      });
      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save();
      }
    }

    return res.json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (error) {
    return next(error);
  }
};
