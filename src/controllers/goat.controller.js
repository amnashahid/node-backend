const mongoose = require("mongoose");
const Goat = require("../models/Goat.model");

// Add Goat
exports.createGoat = async (req, res) => {
  try {
    const goat = await Goat.create(req.body);

    res.status(201).json({
      success: true,
      message: "Goat added successfully",
      data: goat
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Goats
exports.getGoats = async (req, res) => {
  try {
    const { gender, search, isActive } = req.query;

    const filter = {};

    if (gender) filter.gender = gender;

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const goats = await Goat.find(filter).sort({
      createdAt: -1
    });

    res.json({
      success: true,
      count: goats.length,
      data: goats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Goat By ID
exports.getGoatById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goat ID"
      });
    }

    const goat = await Goat.findById(req.params.id);

    if (!goat) {
      return res.status(404).json({
        success: false,
        message: "Goat not found"
      });
    }

    res.json({
      success: true,
      data: goat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Goat
exports.updateGoat = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goat ID"
      });
    }

    const goat = await Goat.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!goat) {
      return res.status(404).json({
        success: false,
        message: "Goat not found"
      });
    }

    res.json({
      success: true,
      message: "Goat updated successfully",
      data: goat
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update Deworming Date
exports.updateDewormingDate = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goat ID"
      });
    }

    const { dewormingDate } = req.body;
    const parsed = new Date(dewormingDate);

    if (!dewormingDate || isNaN(parsed.getTime())) {
      return res.status(400).json({
        success: false,
        message: "A valid dewormingDate is required"
      });
    }

    const goat = await Goat.findByIdAndUpdate(
      req.params.id,
      { dewormingDate: parsed },
      { new: true, runValidators: true }
    );

    if (!goat) {
      return res.status(404).json({
        success: false,
        message: "Goat not found"
      });
    }

    res.json({
      success: true,
      message: "Deworming date updated successfully",
      data: goat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Goat Status
exports.updateGoatStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goat ID"
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean"
      });
    }

    const goat = await Goat.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!goat) {
      return res.status(404).json({
        success: false,
        message: "Goat not found"
      });
    }

    res.json({
      success: true,
      message: "Goat status updated successfully",
      data: goat
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete Goat
exports.deleteGoat = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid goat ID"
      });
    }

    const goat = await Goat.findById(req.params.id);

    if (!goat) {
      return res.status(404).json({
        success: false,
        message: "Goat not found"
      });
    }

    // Keep historical breeding records intact.
    goat.isActive = false;
    await goat.save();

    res.json({
      success: true,
      message: "Goat deactivated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};