
const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing from environment variables");
  }

  try {
    console.log("Connecting to MongoDB Atlas...");

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("MongoDB connected successfully");
    console.log("Database name:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection error:", error.name);
    console.error("Details:", error.message);
    throw error;
  }
}

module.exports = connectDB;