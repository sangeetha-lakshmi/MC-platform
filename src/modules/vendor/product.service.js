const db = require("../../config/database");


// ===============================
// VENDOR SIDE
// ===============================

// get all products for logged-in vendor (ALL products)
exports.getAllProducts = async (vendorId) => {
  const result = await db.query(
    `SELECT 
        id,
        vendor_id,
        name,
        description,
        image,
        price,
        final_price,
        stock,
        is_live,
        preparing_minutes,
        food_type,
        category,
        subcategory,
        created_at,
        updated_at
     FROM products
     WHERE vendor_id = $1
     ORDER BY id DESC`,
    [vendorId]
  );

  return result.rows;
};


// 🔥 ADD THIS MISSING FUNCTION
exports.getProductById = async (id) => {
  const { rows } = await db.query(
    `SELECT * FROM products WHERE id = $1`,
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
      preparing_minutes,
      food_type,
      category,
      subcategory
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
      data.preparing_minutes,
      data.food_type,
      data.category,
      data.subcategory,
    ]
  );

  return rows[0];
};


// update product details
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
      preparing_minutes = $8,
      food_type = $9,
      category = $10,
      subcategory = $11,
      updated_at = NOW()
     WHERE id = $12
     RETURNING *`,
    [
      data.name,
      data.description,
      data.image,
      data.price,
      data.discount,
      data.stock,
      data.is_live,
      data.preparing_minutes,
      data.food_type,
      data.category,
      data.subcategory,
      id
    ]
  );

  return rows[0];
};


// 🔥 REAL TOGGLE LIVE STATUS
exports.toggleLiveStatus = async (id) => {
  const { rows } = await db.query(
    `UPDATE products
     SET is_live = NOT is_live,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  );

  return rows[0];
};


// delete product
exports.deleteProduct = async (id) => {
  await db.query("DELETE FROM products WHERE id = $1", [id]);
};



// ===============================
// CUSTOMER SIDE
// ===============================

// get only LIVE products by shop (vendor_id)
exports.getLiveProductsByShop = async (vendorId) => {
  const { rows } = await db.query(
    `SELECT 
        id,
        vendor_id,
        name,
        description,
        image,
        price,
        final_price,
        stock,
        preparing_minutes,
        food_type,
        category,
        subcategory
     FROM products
     WHERE vendor_id = $1
       AND is_live = true
     ORDER BY id DESC`,
    [vendorId]
  );

  return rows;
};


// search LIVE products globally
exports.searchLiveProducts = async (searchText) => {
  const { rows } = await db.query(
    `SELECT 
        id,
        vendor_id,
        name,
        description,
        image,
        price,
        final_price,
        food_type,
        category,
        subcategory
     FROM products
     WHERE is_live = true
       AND LOWER(name) LIKE LOWER($1)
     ORDER BY id DESC`,
    [`%${searchText}%`]
  );

  return rows;
};
