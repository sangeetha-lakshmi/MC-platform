const db = require("../../config/database");

// ===============================
// VENDOR SIDE
// ===============================

// get all products for logged-in vendor (ALL products)
exports.getAllProducts = async (vendorId) => {
  const { rows } = await db.query(
    "SELECT * FROM products WHERE vendor_id = $1 ORDER BY created_at DESC",
    [vendorId]
  );
  return rows;
};

// get single product by id (vendor edit)
exports.getProductById = async (id) => {
  const { rows } = await db.query(
    "SELECT * FROM products WHERE id = $1",
    [id]
  );
  return rows[0];
};

// create product
exports.createProduct = async (vendorId, data) => {
  const { rows } = await db.query(
    `INSERT INTO products (
      vendor_id,
      name,
      description,
      image,
      price,
      discount,
      stock,
      is_live,
      prep_time,
      food_type,
      category
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      vendorId,
      data.name,
      data.description,
      data.image,
      data.price,
      data.discount,
      data.stock,
      data.is_live,
      data.prep_time,
      data.food_type,
      data.category
    ]
  );

  return rows[0];
};

// update product (vendor can turn live ON/OFF)
exports.updateProduct = async (id, data) => {
  const { rows } = await db.query(
    `UPDATE products SET
      name = $1,
      description = $2,
      image = $3,
      price = $4,
      discount = $5,
      stock = $6,
      is_live = $7,
      prep_time = $8,
      food_type = $9,
      category = $10,
      updated_at = NOW()
     WHERE id = $11
     RETURNING *`,
    [
      data.name,
      data.description,
      data.image,
      data.price,
      data.discount,
      data.stock,
      data.is_live,
      data.prep_time,
      data.food_type,
      data.category,
      id
    ]
  );

  return rows[0];
};
exports.updateLiveStatus = async (id, isLive) => {
  const { rows } = await db.query(
    `UPDATE products
     SET is_live = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [isLive, id]
  );
  return rows[0];
};
// delete product
exports.deleteProduct = async (id) => {
  await db.query("DELETE FROM products WHERE id = $1", [id]);
};


// ===============================
// CUSTOMER SIDE (NEW)
// ===============================

// get ONLY live products for customers
exports.getProducts = async (req, res) => {
  const products = await service.getLiveProductsForCustomer(); // ✅ CORRECT
  res.json(products);
};

// toggle product live status (PATCH)
exports.updateLiveStatus = async (id, isLive) => {
  const { rows } = await db.query(
    `UPDATE products
     SET is_live = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [isLive, id]
  );
  return rows[0];
};

