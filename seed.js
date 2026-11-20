// Loads 12 sample products (5 categories, 4 of them low on stock).
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  { name: "Wireless Mouse", sku: "ELEC-MS-101", category: "Electronics", price: 799, quantity: 60, reorderLevel: 20, supplier: "Zebtronix" },
  { name: "Mechanical Keyboard", sku: "ELEC-KB-102", category: "Electronics", price: 3499, quantity: 25, reorderLevel: 10, supplier: "KeyCraft" },
  { name: "Bluetooth Speaker", sku: "ELEC-SP-103", category: "Electronics", price: 2499, quantity: 30, reorderLevel: 10, supplier: "SoundWave" },
  { name: "USB-C Hub", sku: "ELEC-HB-104", category: "Electronics", price: 1499, quantity: 6, reorderLevel: 10, supplier: "Zebtronix" },
  { name: "Cotton T-Shirt", sku: "APRL-TS-201", category: "Apparel", price: 499, quantity: 80, reorderLevel: 25, supplier: "UrbanThreads" },
  { name: "Fleece Hoodie", sku: "APRL-HD-202", category: "Apparel", price: 1299, quantity: 5, reorderLevel: 10, supplier: "UrbanThreads" },
  { name: "Ergonomic Office Chair", sku: "FURN-CH-301", category: "Furniture", price: 6500, quantity: 14, reorderLevel: 5, supplier: "ComfortCraft" },
  { name: "Wooden Bookshelf", sku: "FURN-BS-302", category: "Furniture", price: 4499, quantity: 3, reorderLevel: 4, supplier: "ComfortCraft" },
  { name: "A4 Notebook (200 pages)", sku: "STNY-NB-401", category: "Stationery", price: 90, quantity: 300, reorderLevel: 100, supplier: "PaperWorld" },
  { name: "Gel Pen Pack of 10", sku: "STNY-PN-402", category: "Stationery", price: 120, quantity: 18, reorderLevel: 30, supplier: "PaperWorld" },
  { name: "Basmati Rice 5kg", sku: "GROC-RC-501", category: "Grocery", price: 650, quantity: 45, reorderLevel: 15, supplier: "Golden Harvest" },
  { name: "Olive Oil 1L", sku: "GROC-OL-502", category: "Grocery", price: 899, quantity: 60, reorderLevel: 20, supplier: "Golden Harvest" }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
