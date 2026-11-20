const express = require("express");
const controller = require("../controllers/productController");
const {
  validateObjectId,
  validateProductBody,
  validateStockChange
} = require("../middleware/validate");

const router = express.Router();

// Report routes come first so "low-stock" and "summary" are not read as an :id
router.get("/low-stock", controller.getLowStock);
router.get("/summary", controller.getCategorySummary);

router
  .route("/")
  .get(controller.getProducts)
  .post(validateProductBody(true), controller.createProduct);

router
  .route("/:id")
  .all(validateObjectId)
  .get(controller.getProductById)
  .put(validateProductBody(false), controller.updateProduct)
  .delete(controller.deleteProduct);

router.patch("/:id/stock", validateObjectId, validateStockChange, controller.adjustStock);

module.exports = router;
