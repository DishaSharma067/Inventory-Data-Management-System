const express = require("express");
const productRoutes = require("./routes/productRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/", (req, res) => {
  res.json({ message: "Inventory and Data Management System API is running" });
});

app.use("/api/products", productRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
