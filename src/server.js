
require("dotenv").config();

const app = require("./app");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log(
      "MONGODB_URI configured:",
      Boolean(process.env.MONGODB_URI)
    );

    await connectDB();

    console.log("MongoDB ready state:", mongoose.connection.readyState);

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error.name);
    console.error("Reason:", error.message);
    process.exit(1);
  }
}

startServer();
