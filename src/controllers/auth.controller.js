const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Otp = require("../models/Otp");
const RefreshToken = require("../models/RefreshToken");
const { sendOtpSms } = require("../services/sms.service");

const Address = require("../models/Address");
const StoreSettings = require("../models/StoreSettings");

const ACCESS_MINUTES = Number(process.env.ACCESS_TOKEN_MINUTES || 1000000000);
const REFRESH_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 30);
const OTP_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);

function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");

  // Accept 03XXXXXXXXX, 923XXXXXXXXX, or 3XXXXXXXXX.
  let local = digits;

  if (local.startsWith("0092")) local = local.slice(4);
  else if (local.startsWith("92")) local = local.slice(2);
  else if (local.startsWith("0")) local = local.slice(1);

  if (!/^3\d{9}$/.test(local)) return null;

  return `+92${local}`;
}

function createAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      type: "access",
    },
    process.env.JWT_SECRET,
    { expiresIn: `${ACCESS_MINUTES}m` }
  );
}

function createOpaqueToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(user) {
  return {
    id: user._id,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    language: user.language,
    addresses: user.addresses,
    profileCompleted: user.profileCompleted,
    role: user.role,
    isActive: user.isActive,
  };
}

async function issueTokens(user) {
  const accessToken = createAccessToken(user);
  const refreshToken = createOpaqueToken();

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(
      Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000
    ),
  });

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_MINUTES * 60,
  };
}

// POST /api/auth/send-otp
exports.sendOtp = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body.phone);

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Pakistani mobile number.",
      });
    }

    const now = Date.now();
    let record = await Otp.findOne({ phone });

    if (record && record.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "OTP limit reached. Please try again later.",
      });
    }
    // prod
    // // Resend cooldown: one request every 60 seconds.
    // if (record && now - record.lastSentAt.getTime() < 60_000) {
    //   return res.status(429).json({
    //     success: false,
    //     message: "Please wait before requesting another OTP.",
    //   });
    // }

    const otp = crypto.randomInt(100000, 1000000).toString();
    // prod
    const otpHash = otp;///dev only//await bcrypt.hash(otp, 10);

    // Save the OTP before sending. If SMS fails, remove it so the
    // user can retry rather than being locked out by a failed delivery.
    if (!record) {
      record = new Otp({
        phone,
        otpHash,
        attempts: 0,
        lastSentAt: new Date(),
      });
    } else {
      record.otpHash = otpHash;
      record.lastSentAt = new Date();
    }

    record.expiresAt = new Date(now + OTP_MINUTES * 60_000);
    await record.save();

    try {
      await sendOtpSms(phone, otp);
    } catch (error) {
      await Otp.deleteOne({ _id: record._id });
      throw error;
    }

    return res.json({
      success: true,
      message: "OTP sent successfully.",
      expiresIn: OTP_MINUTES * 60,
      ...(process.env.OTP_DEBUG === "true" ? { devOtp: otp } : {}),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res, next) => {
  try {
    console.log("Verifying OTP");
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || "");
    console.log(otp);
    console.log(phone);
    if (!phone || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "A valid phone number and six-digit OTP are required.",
      });
    }

    const record = await Otp.findOne({ phone });
    console.log(record);
    if (!record || record.expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found. Request a new OTP.",
      });
    }
    console.log(record.attempts);

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new OTP later.",
      });
    }

    const matches = otp === record.otpHash;  // PROD await bcrypt.compare(otp, record.otpHash);

    if (!matches) {
      record.attempts += 1;
      await record.save();
      console.log("Attempt saved");

      return res.status(400).json({
        success: false,
        message: "Incorrect OTP.",
        attemptsRemaining: Math.max(
          0,
          OTP_MAX_ATTEMPTS - record.attempts
        ),
      });
    }
    console.log("OTP verified");
    await Otp.deleteOne({ _id: record._id });

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        phone,
        phoneVerified: true,
        profileCompleted: false,
        role: "customer",
      });
    } else {
      user.phoneVerified = true;
      await user.save();
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is disabled.",
      });
    }

    const tokens = await issueTokens(user);

    return res.json({
      success: true,
      message: "Phone number verified.",
      data: {
        ...tokens,
        user: publicUser(user),
        isNewUser: !user.profileCompleted,
        nextStep: user.profileCompleted ? "home" : "information",
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/complete-profile
exports.completeProfile = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      language,
      address,
      latitude,
      longitude,
      label,
    } = req.body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required.",
      });
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address.",
      });
    }

    const hasAddress =
      typeof address === "string" && address.trim().length > 0;

    const hasCoordinates =
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180;

    if (!hasAddress || !hasCoordinates) {
      return res.status(400).json({
        success: false,
        message: "A delivery address and valid location coordinates are required.",
      });
    }

    // Load the store configuration for delivery-area validation.
    const StoreSettings = require("../models/StoreSettings");
    const settings = await StoreSettings.findOne();

    if (!settings || !settings.isActive) {
      return res.status(503).json({
        success: false,
        message: "The store is currently unavailable.",
      });
    }

    const distanceKm = getDistanceKm(
      latitude,
      longitude,
      settings.latitude,
      settings.longitude
    );

    const radiusKm =
      settings.radiusUnit === "meter"
        ? settings.radius / 1000
        : settings.radius;

    if (distanceKm > radiusKm) {
      return res.status(400).json({
        success: false,
        message: "Your address is outside the delivery area.",
        data: { distanceKm: Number(distanceKm.toFixed(2)) },
      });
    }

    const user = await User.findById(req.user.id);

    if (!user || !user.phoneVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your phone number first.",
      });
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.email = email?.trim().toLowerCase() || undefined;
    user.language = language === "ur" ? "ur" : "en";
    user.addresses = [
      {
        label: ["HOME", "WORK", "OTHER"].includes(label) ? label : "HOME",
        addressLine: address.trim(),
        latitude,
        longitude,
        isDefault: true,
      },
    ];
    user.profileCompleted = true;

    await user.save();

    return res.json({
      success: true,
      message: "Profile completed successfully.",
      data: { user: publicUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/auth/refresh
exports.refresh = async (req, res, next) => {
  try {
    const token = req.body.refreshToken;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const tokenHash = hashToken(token);
    const stored = await RefreshToken.findOne({
      tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!stored) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is invalid or expired.",
      });
    }

    const user = await User.findById(stored.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is unavailable.",
      });
    }

    // Rotate the refresh token: the old one cannot be reused.
    stored.revokedAt = new Date();
    await stored.save();

    const tokens = await issueTokens(user);

    return res.json({
      success: true,
      data: {
        ...tokens,
        user: publicUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    const token = req.body.refreshToken;

    if (token && typeof token === "string") {
      await RefreshToken.updateOne(
        {
          tokenHash: hashToken(token),
          revokedAt: null,
        },
        { $set: { revokedAt: new Date() } }
      );
    }

    return res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is unavailable.",
      });
    }

    return res.json({
      success: true,
      data: { user: publicUser(user) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
exports.adminLogin = async (req, res, next) => {
  try {
    const user = await User.findOne({phone: req.body.phone});

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is unavailable.",
      });
    }
    const tokens = await issueTokens(user);

    return res.json({
      success: true,
      data: { user: publicUser(user), ...tokens },
    });
  } catch (error) {
    next(error);
  }
};

// Calculate distance between two GPS coordinates in kilometers.
function calculateDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  );
}

exports.completeProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
console.log( req.user);
    const {
      firstName,
      lastName,
      email,
      location,
      latitude,
      longitude,
      address,
      label = "HOME",
    } = req.body;


    // Validate required profile fields.
    if (!firstName?.trim() ) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    // Validate email when supplied.
    const normalizedEmail = email?.trim().toLowerCase() || "";

    if (
      normalizedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Require GPS coordinates for delivery-radius validation.
    const lat = Number(latitude);
    const lon = Number(longitude);

    // if (
    //   latitude === undefined ||
    //   latitude === null ||
    //   latitude === "" ||
    //   longitude === undefined ||
    //   longitude === null ||
    //   longitude === "" ||
    //   !Number.isFinite(lat) ||
    //   !Number.isFinite(lon) ||
    //   lat < -90 ||
    //   lat > 90 ||
    //   lon < -180 ||
    //   lon > 180
    // ) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "A valid delivery location is required.",
    //   });
    // }

    if (!address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required.",
      });
    }

    // Find the authenticated customer.
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.phoneVerified) {
      return res.status(403).json({
        success: false,
        message: "Verify your phone number first.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive.",
      });
    }
        //prod its need to be updated as delivery area validation
    // // Find the active store configuration.
    // const store = await StoreSettings.findOne({
    // });
    // console.log("Active store configuration:", store);

    // if (!store) {
    //   return res.status(503).json({
    //     success: false,
    //     message: "Delivery service is currently unavailable in your area.",
    //   });
    // }

    // // Assumes StoreSettings uses lat, lon, and radius in kilometers.
    // const storeLat = Number(store.lat);
    // const storeLon = Number(store.lon);
    // console.log("Store location and radius:", { storeLat, storeLon, radiusKm });

    // if (
    //   !Number.isFinite(storeLat) ||
    //   !Number.isFinite(storeLon) ||
    //   storeLat < -90 ||
    //   storeLat > 90 ||
    //   storeLon < -180 ||
    //   storeLon > 180 
    // ) {
    //   console.error("Invalid active store location configuration.");

    //   return res.status(503).json({
    //     success: false,
    //     message: "Delivery service is not configured correctly.",
    //   });
    // }

    // const distanceKm = calculateDistance(
    //   storeLat,
    //   storeLon,
    //   lat,
    //   lon
    // );

    // if (distanceKm > radiusKm) {
    //   return res.status(400).json({
    //     success: false,
    //     code: "OUTSIDE_DELIVERY_AREA",
    //     message: "Sorry, your address is outside our delivery area.",
    //     data: {
    //       distanceKm: Number(distanceKm.toFixed(2)),
    //       radiusKm,
    //     },
    //   });
    // }

    // Update the profile only after all validations pass.
    user.firstName = firstName.trim();
    user.lastName = lastName.trim();

    if (normalizedEmail) {
      user.email = normalizedEmail;
    }

    user.profileCompleted = true;

    // Create a separate address record.
    const newAddress = await Address.create({
      userId: user._id,
      label,
      addressLine: address.trim(),
      area: location?.trim() || "",
      latitude: lat,
      longitude: lon,
      isDefault: true,
    });

    try {
      // Save the user after the address is created.
      await user.save();
    } catch (error) {
      // Avoid leaving an orphan address if saving the profile fails.
      await Address.deleteOne({ _id: newAddress._id });
      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Profile completed successfully.",
      data: {
        user: {
          id: user._id,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email || "",
          profileCompleted: user.profileCompleted,
          role: user.role,
        },
        address: {
          id: newAddress._id,
          label: newAddress.label,
          addressLine: newAddress.addressLine,
          area: newAddress.area,
          latitude: newAddress.latitude,
          longitude: newAddress.longitude,
          isDefault: newAddress.isDefault,
        },
      },
    });
  } catch (error) {
    console.error("Complete profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to complete your profile. Please try again.",
    });
  }
};