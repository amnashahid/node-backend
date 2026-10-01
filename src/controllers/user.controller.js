const User = require("../models/User");

// ============================================
// GET ALL USERS
// GET /api/users
// ============================================

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-otp")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET ADMINS
// GET /api/users/admins
// ============================================

const getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({
      role: "admin",
    })
      .select("-otp")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET CUSTOMERS
// GET /api/users/customers
// ============================================

const getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({
      role: "customer",
    })
      .select("-otp")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// GET SINGLE USER
// GET /api/users/:id
// ============================================

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-otp");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CREATE USER
// POST /api/users
// ============================================

const createUser = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      email,
      language,
      role,
      isActive,
      addresses,
    } = req.body;

    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required",
      });
    }

    if (!["admin", "customer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Role must be either admin or customer",
      });
    }

    if (
      language &&
      !["en", "ur"].includes(language)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Language must be either en or ur",
      });
    }

    // ----------------------------------------
    // CHECK PHONE
    // ----------------------------------------

    const existingUser = await User.findOne({
      phone: phone.trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this phone number already exists",
      });
    }

    // ----------------------------------------
    // PROCESS ADDRESSES
    // ----------------------------------------

    let processedAddresses = [];

    if (Array.isArray(addresses)) {
      processedAddresses = addresses
        .filter(
          (address) =>
            address &&
            address.address &&
            address.address.trim()
        )
        .map((address) => ({
          label:
            address.label?.trim() ||
            "Home",

          address:
            address.address.trim(),

          location:
            address.location?.trim() ||
            "",

          latitude:
            address.latitude !==
              undefined &&
            address.latitude !== ""
              ? Number(address.latitude)
              : undefined,

          longitude:
            address.longitude !==
              undefined &&
            address.longitude !== ""
              ? Number(address.longitude)
              : undefined,

          isDefault:
            address.isDefault === true,
        }));
    }

    // ----------------------------------------
    // ENSURE ONE DEFAULT ADDRESS
    // ----------------------------------------

    if (
      processedAddresses.length > 0 &&
      !processedAddresses.some(
        (address) => address.isDefault
      )
    ) {
      processedAddresses[0].isDefault =
        true;
    }

    // ----------------------------------------
    // CREATE USER
    // ----------------------------------------

    const user = await User.create({
      firstName: firstName.trim(),

      name:
        name?.trim() || "",

      phone: phone.trim(),

      email:
        email?.trim().toLowerCase() || "",

      language: language || "en",

      role,

      isActive:
        isActive !== false,

      addresses: processedAddresses,
    });

    // ----------------------------------------
    // REMOVE OTP
    // ----------------------------------------

    const responseUser =
      user.toObject();

    delete responseUser.otp;

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: responseUser,
    });
  } catch (error) {
    // Duplicate phone protection
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this phone number already exists",
      });
    }

    next(error);
  }
};

// ============================================
// UPDATE USER
// PUT /api/users/:id
// ============================================

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      name,
      phone,
      email,
      language,
      role,
      isActive,
      addresses,
    } = req.body;

    // ----------------------------------------
    // FIND USER
    // ----------------------------------------

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ----------------------------------------
    // VALIDATION
    // ----------------------------------------

    if (
      name !== undefined &&
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (
      role !== undefined &&
      !["admin", "customer"].includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Role must be either admin or customer",
      });
    }

    if (
      language !== undefined &&
      !["en", "ur"].includes(language)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Language must be either en or ur",
      });
    }

    // ----------------------------------------
    // PHONE
    // ----------------------------------------
    // Phone is intentionally not changed
    // from the frontend.

    if (
      phone !== undefined &&
      phone !== user.phone
    ) {
      const phoneExists =
        await User.findOne({
          phone: phone.trim(),
          _id: { $ne: id },
        });

      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message:
            "A user with this phone number already exists",
        });
      }

      user.phone = phone.trim();
    }

    // ----------------------------------------
    // BASIC INFORMATION
    // ----------------------------------------

    if (name !== undefined) {
      user.name =
        name.trim();
    }

    // if (lastName !== undefined) {
    //   user.lastName =
    //     lastName?.trim() || "";
    // }

    if (email !== undefined) {
      user.email =
        email?.trim().toLowerCase() || "";
    }

    if (language !== undefined) {
      user.language = language;
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    // ----------------------------------------
    // ADDRESSES
    // ----------------------------------------

    if (Array.isArray(addresses)) {
      const processedAddresses =
        addresses
          .filter(
            (address) =>
              address &&
              address.address &&
              address.address.trim()
          )
          .map((address) => ({
            _id: address._id,

            label:
              address.label?.trim() ||
              "Home",

            address:
              address.address.trim(),

            location:
              address.location?.trim() ||
              "",

            latitude:
              address.latitude !==
                undefined &&
              address.latitude !== ""
                ? Number(address.latitude)
                : undefined,

            longitude:
              address.longitude !==
                undefined &&
              address.longitude !== ""
                ? Number(address.longitude)
                : undefined,

            isDefault:
              address.isDefault === true,
          }));

      // Make sure there is only one
      // default address.
      let defaultFound = false;

      processedAddresses.forEach(
        (address) => {
          if (address.isDefault) {
            if (!defaultFound) {
              defaultFound = true;
            } else {
              address.isDefault = false;
            }
          }
        }
      );

      // If there is no default address,
      // make the first one default.
      if (
        processedAddresses.length > 0 &&
        !processedAddresses.some(
          (address) => address.isDefault
        )
      ) {
        processedAddresses[0].isDefault =
          true;
      }

      user.addresses =
        processedAddresses;
    }

    // ----------------------------------------
    // SAVE
    // ----------------------------------------

    await user.save();

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------

    const responseUser =
      user.toObject();

    delete responseUser.otp;

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: responseUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this phone number already exists",
      });
    }

    next(error);
  }
};

// ============================================
// DELETE USER
// DELETE /api/users/:id
// ============================================

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user =
      await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// EXPORT
// ============================================

module.exports = {
  getUsers,
  getAdmins,
  getCustomers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};