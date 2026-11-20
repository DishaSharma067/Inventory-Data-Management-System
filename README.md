# Inventory and Data Management System

A RESTful backend for a store or warehouse to manage its product catalogue, built with Node.js, Express.js, MongoDB and Mongoose. It supports full CRUD, filtering, sorting and pagination, safe stock adjustments (restock and sale), and inventory reports using MongoDB aggregation pipelines.

## Tech Stack

- **Node.js** – server-side runtime
- **Express.js** – routing and middleware
- **MongoDB** – NoSQL database
- **Mongoose** – schema, validation and queries
- **dotenv** – environment variables

## Project Structure

```
inventory-data-management-system/
├── config/
│   └── db.js
├── controllers/
│   └── productController.js
├── middleware/
│   ├── errorHandler.js
│   └── validate.js
├── models/
│   └── Product.js
├── routes/
│   └── productRoutes.js
├── utils/
│   ├── AppError.js
│   └── asyncHandler.js
├── app.js
├── server.js
├── seed.js
├── postman_collection.json
├── .env.example
├── .gitignore
└── package.json
```

## Setup

```bash
git clone https://github.com/DishaSharma067/inventory-data-management-system.git
cd inventory-data-management-system
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Update `MONGO_URI` in `.env` if needed (use your connection string for MongoDB Atlas).

```bash
npm run seed    # optional: loads 12 sample products
npm start       # or: npm run dev (nodemon)
```

The server runs at `http://localhost:5000`. Import `postman_collection.json` into Postman to try every endpoint.

## Product Schema

| Field        | Type   | Validation                                        |
|--------------|--------|---------------------------------------------------|
| name         | String | required, 2–100 characters                        |
| sku          | String | required, unique, stored in uppercase             |
| category     | String | required                                          |
| price        | Number | required, >= 0                                    |
| quantity     | Number | whole number, >= 0, default 0                     |
| reorderLevel | Number | >= 0, default 10                                  |
| supplier     | String | optional                                          |

Timestamps (`createdAt`, `updatedAt`) are added automatically, and a virtual `stockValue` (`price × quantity`) is included in every response.

## API Endpoints

| Method | Endpoint                    | Description                                   |
|--------|-----------------------------|-----------------------------------------------|
| POST   | /api/products               | Create a product                              |
| GET    | /api/products               | List products (filter, sort, paginate)        |
| GET    | /api/products/:id           | Get a single product                          |
| PUT    | /api/products/:id           | Update product details                        |
| PATCH  | /api/products/:id/stock     | Restock (+) or sell (-) safely                |
| DELETE | /api/products/:id           | Delete a product                              |
| GET    | /api/products/low-stock     | Products at or below their reorder level      |
| GET    | /api/products/summary       | Category-wise inventory summary               |

### Query parameters for `GET /api/products`

| Param      | Example           | Meaning                                    |
|------------|-------------------|--------------------------------------------|
| category   | `Furniture`       | Exact category (case-insensitive)          |
| supplier   | `paper`           | Partial supplier match                     |
| search     | `pen`             | Searches name and SKU                      |
| minPrice   | `100`             | price >= value                             |
| maxPrice   | `5000`            | price <= value                             |
| sort       | `-price,name`     | `-` prefix sorts descending                |
| page       | `2`               | Page number (default 1)                    |
| limit      | `5`               | Items per page (default 10, max 100)       |

Response shape:

```json
{
  "total": 12,
  "page": 1,
  "totalPages": 2,
  "count": 10,
  "products": []
}
```

### Create a product

`POST /api/products`

```json
{
  "name": "Gel Pen Pack of 15",
  "sku": "STNY-PN-713",
  "category": "Stationery",
  "price": 120,
  "quantity": 40,
  "reorderLevel": 20,
  "supplier": "Cello Pens"
}
```

### Adjust stock

`PATCH /api/products/:id/stock`

```json
{ "change": 10 }
```

A positive number restocks and a negative number records a sale. The update is a single atomic MongoDB operation with a guard, so quantity can never go below zero even with simultaneous requests. If stock is insufficient the API returns `409`.

### Reports

- `GET /api/products/low-stock` → `{ "count": 4, "lowStockItems": [...] }` using an aggregation `$match` with `$expr` (quantity <= reorderLevel), sorted by lowest quantity first.
- `GET /api/products/summary` → `{ "categories": 5, "summary": [...] }` using `$group` to return `totalItems`, `totalQuantity`, `totalStockValue` and `avgPrice` per category.

## Error Handling

All errors pass through one central handler and return JSON:

```json
{ "message": "Validation failed", "errors": ["price must be a number greater than or equal to 0"] }
```

| Code | Meaning                                              |
|------|------------------------------------------------------|
| 200  | Success                                              |
| 201  | Product created                                      |
| 400  | Validation error, invalid id, bad query or JSON      |
| 404  | Product or route not found                           |
| 409  | Duplicate SKU or insufficient stock                  |
| 500  | Unexpected server error                              |

## AUTHOR
Disha
