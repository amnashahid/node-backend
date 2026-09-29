const express = require("express");
const cors = require("cors");
//const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const app = express();
const categoryRoutes = require("./routes/category.routes");

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

app.use("/Uploads", express.static(path.join(__dirname, '/uploads')));
app.use("/api", routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;