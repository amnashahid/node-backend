const express = require("express");
const cors = require("cors");
//const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const app = express();

app.use(cors());
//app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const path = require("path");

const notFoundMiddleware =
    require("./middleware/notFound.middleware");

const errorMiddleware =
    require("./middleware/error.middleware");

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "E-Commerce API is running"
  });
});
// app.get("/api/server-ip", async (req, res) => {
//     try {
//         const response = await fetch("https://api.ipify.org?format=json");
//         const data = await response.json();

//         res.json({
//             ip: data.ip
//         });
//     } catch (error) {
//         res.status(500).json({
//             error: error.message
//         });
//     }
// });
app.use("/Uploads", express.static(path.join(__dirname, '/uploads')));
app.use("/api", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;