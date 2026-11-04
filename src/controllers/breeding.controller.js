const mongoose = require("mongoose");
const Breeding = require("../models/Breeding.model");
const Goat = require("../models/Goat.model");

// Validate breeding goats
const validateBreedingGoats = async (femaleId, maleIds) => {
  if (!mongoose.isValidObjectId(femaleId)) {
    throw new Error("Invalid female goat ID");
  }

  if (!Array.isArray(maleIds) || maleIds.length === 0) {
    throw new Error("At least one male goat is required");
  }

  const uniqueMaleIds = [...new Set(maleIds.map(String))];

  if (uniqueMaleIds.some(id => !mongoose.isValidObjectId(id))) {
    throw new Error("Invalid male goat ID");
  }

  if (uniqueMaleIds.includes(String(femaleId))) {
    throw new Error("Female goat cannot be selected as a male");
  }

  const female = await Goat.findById(femaleId);

  if (!female || female.gender !== "female" || !female.isActive) {
    throw new Error("Selected female goat is invalid or inactive");
  }

  const males = await Goat.find({
    _id: { $in: uniqueMaleIds },
    gender: "male",
    isActive: true
  });

  if (males.length !== uniqueMaleIds.length) {
    throw new Error("One or more selected male goats are invalid or inactive");
  }

  return uniqueMaleIds;
};

// Add Breeding Record
exports.createBreeding = async (req, res) => {
  try {
    const { femaleGoat, maleGoats } = req.body;

    const uniqueMaleIds = await validateBreedingGoats(
      femaleGoat,
      maleGoats
    );

    const breeding = await Breeding.create({
      ...req.body,
      maleGoats: uniqueMaleIds
    });

    const result = await Breeding.findById(breeding._id)
      .populate("femaleGoat", "name gender")
      .populate("maleGoats", "name gender");

    res.status(201).json({
      success: true,
      message: "Breeding record added successfully",
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Breeding Records
exports.getBreedings = async (req, res) => {
  try {
    const { femaleGoat, pregnancyStatus, from, to } = req.query;

    const filter = {};

    if (femaleGoat) {
      if (!mongoose.isValidObjectId(femaleGoat)) {
        return res.status(400).json({
          success: false,
          message: "Invalid female goat ID"
        });
      }

      filter.femaleGoat = femaleGoat;
    }

    if (pregnancyStatus) {
      filter.pregnancyStatus = pregnancyStatus;
    }

    if (from || to) {
      filter.breedingDate = {};

      if (from) filter.breedingDate.$gte = new Date(from);
      if (to) filter.breedingDate.$lte = new Date(to);
    }

    const records = await Breeding.find(filter)
      .populate("femaleGoat", "name gender")
      .populate("maleGoats", "name gender")
      .sort({ breedingDate: -1 });

    res.json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Breeding By ID
exports.getBreedingById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid breeding ID"
      });
    }

    const record = await Breeding.findById(req.params.id)
      .populate("femaleGoat")
      .populate("maleGoats");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Breeding record not found"
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Breeding Record
exports.updateBreeding = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid breeding ID"
      });
    }

    const record = await Breeding.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Breeding record not found"
      });
    }

    const femaleGoat = req.body.femaleGoat || record.femaleGoat;
    const maleGoats = req.body.maleGoats || record.maleGoats;

    const uniqueMaleIds = await validateBreedingGoats(
      femaleGoat,
      maleGoats
    );

    const allowedFields = [
      "femaleGoat",
      "maleGoats",
      "breedingDate",
      "pregnancyStatus",
      "expectedDeliveryDate",
      "actualDeliveryDate",
      "notes"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field];
      }
    });

    record.femaleGoat = femaleGoat;
    record.maleGoats = uniqueMaleIds;

    await record.save();

    await record.populate("femaleGoat", "name gender");
    await record.populate("maleGoats", "name gender");

    res.json({
      success: true,
      message: "Breeding record updated successfully",
      data: record
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Breeding Record
exports.deleteBreeding = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid breeding ID"
      });
    }

    const record = await Breeding.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Breeding record not found"
      });
    }

    res.json({
      success: true,
      message: "Breeding record deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};