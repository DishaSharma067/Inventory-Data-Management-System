const Product = require("../models/Product");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const SORT_FIELDS = ["name", "price", "quantity", "category", "createdAt", "updatedAt"];
const UPDATABLE = ["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier"];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseNumber = (value, label) => {
  const n = Number(value);
  if (Number.isNaN(n)) throw new AppError(`${label} must be a number`, 400);
  return n;
};

// POST /api/products
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// GET /api/products  (filtering, search, sorting, pagination)
exports.getProducts = asyncHandler(async (req, res) => {
  const { category, supplier, search, minPrice, maxPrice, sort } = req.query;
  const filter = {};

  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  if (supplier) filter.supplier = new RegExp(escapeRegex(supplier), "i");
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: rx }, { sku: rx }];
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = parseNumber(minPrice, "minPrice");
    if (maxPrice !== undefined) filter.price.$lte = parseNumber(maxPrice, "maxPrice");
  }

  // ?sort=-price,name  ->  { price: -1, name: 1 }
  let sortBy = { createdAt: -1 };
  if (sort) {
    sortBy = {};
    sort.split(",").forEach((part) => {
      const field = part.replace(/^-/, "");
      if (!SORT_FIELDS.includes(field)) {
        throw new AppError(`Cannot sort by '${field}'. Allowed: ${SORT_FIELDS.join(", ")}`, 400);
      }
      sortBy[field] = part.startsWith("-") ? -1 : 1;
    });
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortBy).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter)
  ]);

  res.status(200).json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    count: products.length,
    products
  });
});

// GET /api/products/:id
exports.getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  res.status(200).json(product);
});

// PUT /api/products/:id  (update product details, partial fields allowed)
exports.updateProduct = asyncHandler(async (req, res) => {
  const updates = {};
  UPDATABLE.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });
  if (!product) throw new AppError("Product not found", 404);
  res.status(200).json(product);
});

// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new AppError("Product not found", 404);
  res.status(200).json({ message: "Product deleted", id: product._id });
});

// PATCH /api/products/:id/stock   body: { "change": 10 } or { "change": -4 }
// A single atomic update ($inc with a guard), so concurrent sales can never
// push the quantity below zero.
exports.adjustStock = asyncHandler(async (req, res) => {
  const { change } = req.body;

  const filter = { _id: req.params.id };
  if (change < 0) filter.quantity = { $gte: Math.abs(change) };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { quantity: change } },
    { new: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: req.params.id });
    if (!exists) throw new AppError("Product not found", 404);
    throw new AppError("Insufficient stock for this sale", 409);
  }

  res.status(200).json({ message: "Stock updated", product });
});

// GET /api/products/low-stock   (aggregation: quantity <= reorderLevel)
exports.getLowStock = asyncHandler(async (req, res) => {
  const rows = await Product.aggregate([
    { $match: { $expr: { $lte: ["$quantity", "$reorderLevel"] } } },
    { $sort: { quantity: 1 } }
  ]);

  // hydrate so the response includes the stockValue and id virtuals
  const lowStockItems = rows.map((row) => Product.hydrate(row));
  res.status(200).json({ count: lowStockItems.length, lowStockItems });
});

// GET /api/products/summary   (aggregation: category-wise inventory summary)
exports.getCategorySummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        totalItems: { $sum: 1 },
        totalQuantity: { $sum: "$quantity" },
        totalStockValue: { $sum: { $multiply: ["$price", "$quantity"] } },
        avgPrice: { $avg: "$price" }
      }
    },
    {
      $project: {
        totalItems: 1,
        totalQuantity: 1,
        totalStockValue: 1,
        avgPrice: { $round: ["$avgPrice", 2] }
      }
    },
    { $sort: { totalStockValue: -1 } }
  ]);

  res.status(200).json({ categories: summary.length, summary });
});
