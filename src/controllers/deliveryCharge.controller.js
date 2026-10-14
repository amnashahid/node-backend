const DeliveryCharge = require("../models/deliveryCharge.model");
const { calculateDeliveryCharge } = require("../services/delivery.service");

function fail(res, message) {
  return res.status(400).json({ success: false, message });
}

function validateTiers(tiers) {
  if (!Array.isArray(tiers)) return "tiers must be an array.";

  for (const tier of tiers) {
    if (
      !tier ||
      !["minKm", "maxKm", "charge"].every(
        (field) => typeof tier[field] === "number" && Number.isFinite(tier[field])
      )
    ) {
      return "Each tier needs numeric minKm, maxKm and charge values.";
    }

    if (tier.minKm < 0 || tier.charge < 0) {
      return "minKm and charge must be 0 or greater.";
    }

    if (tier.maxKm <= tier.minKm) {
      return "Each tier's maxKm must be greater than its minKm.";
    }
  }

  const sorted = [...tiers].sort((a, b) => a.minKm - b.minKm);
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].minKm < sorted[index - 1].maxKm) {
      return "Distance tiers must not overlap.";
    }
  }

  return null;
}

// GET /api/delivery-charges
exports.getConfig = async (req, res, next) => {
  try {
    const config = await DeliveryCharge.findOne().lean();
    const data = config || { tiers: [], defaultCharge: 250 };
    data.tiers = [...data.tiers].sort((a, b) => a.minKm - b.minKm);

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/delivery-charges (admin)
exports.upsertConfig = async (req, res, next) => {
  try {
    const { tiers, defaultCharge } = req.body;

    if (tiers === undefined && defaultCharge === undefined) {
      return fail(res, "Provide tiers and/or defaultCharge.");
    }

    if (tiers !== undefined) {
      const message = validateTiers(tiers);
      if (message) return fail(res, message);
    }

    if (
      defaultCharge !== undefined &&
      (typeof defaultCharge !== "number" ||
        !Number.isFinite(defaultCharge) ||
        defaultCharge < 0)
    ) {
      return fail(res, "defaultCharge must be a number of 0 or more.");
    }

    const config = (await DeliveryCharge.findOne()) || new DeliveryCharge();

    if (tiers !== undefined) {
      config.tiers = [...tiers]
        .sort((a, b) => a.minKm - b.minKm)
        .map(({ minKm, maxKm, charge }) => ({ minKm, maxKm, charge }));
    }
    if (defaultCharge !== undefined) config.defaultCharge = defaultCharge;

    await config.save();

    return res.json({
      success: true,
      message: "Delivery charges saved successfully.",
      data: config,
    });
  } catch (error) {
    return next(error);
  }
};

// POST /api/delivery-charges/calculate  { latitude, longitude }
exports.calculate = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body || {};
    const result = await calculateDeliveryCharge(latitude, longitude);

    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};
