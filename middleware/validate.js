const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

const isBlank = (v) => typeof v !== "string" || v.trim() === "";

// Rejects malformed ObjectIds before they reach the database.
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new AppError(`Invalid product id: ${req.params.id}`, 400));
  }
  next();
};

// Body validation for create (all key fields required) and update (partial).
const validateProductBody = (isCreate) => (req, res, next) => {
  const b = req.body || {};
  const has = (key) => b[key] !== undefined;
  const errors = [];

  if (isCreate) {
    ["name", "sku", "category", "price"].forEach((f) => {
      if (!has(f)) errors.push(`${f} is required`);
    });
  } else if (!["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier"].some(has)) {
    errors.push("Provide at least one field to update");
  }

  ["name", "sku", "category"].forEach((f) => {
    if (has(f) && isBlank(b[f])) errors.push(`${f} must be a non-empty string`);
  });
  if (has("price") && (typeof b.price !== "number" || b.price < 0)) {
    errors.push("price must be a number greater than or equal to 0");
  }
  ["quantity", "reorderLevel"].forEach((f) => {
    if (has(f) && (!Number.isInteger(b[f]) || b[f] < 0)) {
      errors.push(`${f} must be a whole number greater than or equal to 0`);
    }
  });
  if (has("supplier") && typeof b.supplier !== "string") {
    errors.push("supplier must be a string");
  }

  if (errors.length) {
    return res.status(400).json({ message: "Validation failed", errors });
  }
  next();
};

// Body validation for PATCH /:id/stock
const validateStockChange = (req, res, next) => {
  const change = req.body && req.body.change;
  if (!Number.isInteger(change) || change === 0) {
    return next(new AppError("'change' must be a non-zero whole number (+ restock, - sale)", 400));
  }
  next();
};

module.exports = { validateObjectId, validateProductBody, validateStockChange };
