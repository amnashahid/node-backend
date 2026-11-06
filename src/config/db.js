const mongoose = require("mongoose");
mongoose.set('bufferCommands', false);
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing");
  }

  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("MongoDB connected successfully");
    console.log("Database:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed:", error.name);
    console.error(error.message);
    throw error;
  }
}

module.exports = connectDB;