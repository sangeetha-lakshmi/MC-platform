const pool = require("../../config/database");

exports.getNearbyVendorsByCategoryAndSubCategory = async ({
  customerLat,
  customerLng,
  category,
  subCategory,
  radius = 5
}) => {
  const query = `
    SELECT
      v.id AS vendor_id,
      v.shop_name,
      ROUND(
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )::numeric,
        2
      ) AS distance,
      json_agg(
        json_build_object(
          'product_id', p.id,
          'name', p.name,
          'price', p.price
        )
      ) AS products
    FROM vendors v
    JOIN products p ON p.vendor_id = v.id
    WHERE
      p.category = $3
      AND p.subcategory = $4     -- ✅ CORRECT
      AND p.is_live = true
      AND v.is_online = true
      AND v.is_approved = 'approved'  -- ✅ CORRECT
    GROUP BY v.id
    HAVING
      6371 * acos(
        cos(radians($1))
        * cos(radians(v.latitude))
        * cos(radians(v.longitude) - radians($2))
        + sin(radians($1))
        * sin(radians(v.latitude))
      ) <= $5
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    category,
    subCategory,
    radius
  ]);

  return result.rows;
};
exports.getNearbyVendors = async ({
  customerLat,
  customerLng,
  radius = 5
}) => {
  const query = `
    SELECT
      v.id,
      v.shop_name,
      v.business_type,
      v.latitude,
      v.longitude,
      ROUND(
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )::numeric,
        2
      ) AS distance
    FROM vendors v
    WHERE
      v.is_approved = 'approved'
      AND v.is_online = true
      AND 6371 * acos(
        cos(radians($1))
        * cos(radians(v.latitude))
        * cos(radians(v.longitude) - radians($2))
        + sin(radians($1))
        * sin(radians(v.latitude))
      ) <= $3
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    radius
  ]);

  return result.rows;
};

exports.searchShopByName = async (name) => {
  const query = `
    SELECT *
    FROM vendors
    WHERE LOWER(shop_name) LIKE LOWER($1)
      AND is_approved = 'approved'
      AND is_online = true
  `;

  const result = await pool.query(query, [`%${name}%`]);
  return result.rows;
};
exports.getShopsByCategory = async ({
  customerLat,
  customerLng,
  category,
  radius = 5
}) => {
  const query = `
    SELECT
      v.id,
      v.shop_name,
      v.business_type,
      ROUND(
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )::numeric,
        2
      ) AS distance
    FROM vendors v
    WHERE
      v.business_type = $3
      AND v.is_approved = 'approved'
      AND v.is_online = true
      AND v.latitude IS NOT NULL
      AND v.longitude IS NOT NULL
      AND (
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )
      ) <= $4
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    category,
    radius
  ]);

  return result.rows;
};

exports.getVegNonVegShops = async ({
  customerLat,
  customerLng,
  foodType,
  radius = 5
}) => {
  const query = `
    SELECT DISTINCT
      v.id,
      v.shop_name,
      ROUND(
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )::numeric,
        2
      ) AS distance
    FROM vendors v
    JOIN products p ON p.vendor_id = v.id
    WHERE
      p.food_type = $3
      AND p.is_live = true
      AND v.is_approved = 'approved'
      AND v.is_online = true
      AND v.latitude IS NOT NULL
      AND v.longitude IS NOT NULL
      AND (
        6371 * acos(
          cos(radians($1))
          * cos(radians(v.latitude))
          * cos(radians(v.longitude) - radians($2))
          + sin(radians($1))
          * sin(radians(v.latitude))
        )
      ) <= $4
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    foodType,
    radius
  ]);

  return result.rows;
};

/* ================= GET CATEGORIES WITH SUBCATEGORIES ================= */

exports.getCategoriesWithSubCategories = async () => {

  const query = `
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      c.icon AS category_icon,
      json_agg(
        json_build_object(
          'sub_id', s.id,
          'name', s.name,
          'icon', s.icon
        )
      ) AS sub_categories
    FROM app_data.categories c
    LEFT JOIN app_data.sub_categories s
      ON s.category_id = c.id
      AND s.is_active = TRUE
    WHERE c.is_active = TRUE
    GROUP BY c.id
    ORDER BY c.id;
  `;

  const result = await pool.query(query);

  return result.rows;
};
/* ================= GET SUBCATEGORIES BY CATEGORY ================= */

exports.getSubCategoriesByCategory = async (categoryId) => {

  const query = `
    SELECT
      id,
      name,
      icon
    FROM app_data.sub_categories
    WHERE category_id = $1
      AND is_active = TRUE
    ORDER BY id
  `;

  const result = await pool.query(query, [categoryId]);

  return result.rows;
};
/* ================= ADD TO CART ================= */

exports.addToCart = async ({
  customerId,
  vendorId,
  productId,
  quantity = 1
}) => {

  // 🔹 Check if cart already has items from another vendor
  const existingVendor = await pool.query(
    `SELECT vendor_id
     FROM cart_items
     WHERE customer_id = $1
     LIMIT 1`,
    [customerId]
  );

  if (
    existingVendor.rowCount > 0 &&
    existingVendor.rows[0].vendor_id !== vendorId
  ) {
    throw new Error(
      "Cart already contains items from another shop"
    );
  }

  // 🔹 Check if product already in cart
  const existingProduct = await pool.query(
    `SELECT id, quantity
     FROM cart_items
     WHERE customer_id = $1
       AND product_id = $2`,
    [customerId, productId]
  );

  if (existingProduct.rowCount > 0) {

    // Update quantity
    await pool.query(
      `UPDATE cart_items
       SET quantity = quantity + $1
       WHERE id = $2`,
      [quantity, existingProduct.rows[0].id]
    );

  } else {

    // Insert new item
    await pool.query(
      `INSERT INTO cart_items
       (customer_id, vendor_id, product_id, quantity)
       VALUES ($1,$2,$3,$4)`,
      [customerId, vendorId, productId, quantity]
    );
  }

  return true;
};
exports.getCartItems = async (customerId) => {

  const result = await pool.query(
    `SELECT
       c.id,
       p.name,
       p.price,
       c.quantity,
       v.shop_name
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     JOIN vendors v ON v.id = c.vendor_id
     WHERE c.customer_id = $1`,
    [customerId]
  );

  return result.rows;
};
/* ================= PLACE ORDER ================= */
exports.placeOrder = async ({ customerId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Get cart items WITH product price
    const cartRes = await client.query(
      `SELECT 
         c.product_id,
         c.quantity,
         p.price
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.customer_id = $1`,
      [customerId]
    );

    if (cartRes.rows.length === 0) {
      throw new Error("Cart is empty");
    }

    const items = cartRes.rows;

    // 2️⃣ Calculate total using product price
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 3️⃣ Generate order code
    const orderCode = "ORD-" + Date.now();

    // 4️⃣ Insert order
    const orderRes = await client.query(
      `INSERT INTO orders
       (order_code, customer_id, total_amount, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [orderCode, customerId, totalAmount]
    );

    const orderId = orderRes.rows[0].id;

    // 5️⃣ Insert order items
    for (const item of items) {

  // 🔹 Get product name from products table
  const productRes = await client.query(
    `SELECT name FROM products WHERE id = $1`,
    [item.product_id]
  );

  const productName = productRes.rows[0]?.name || "Unknown";

  await client.query(
    `INSERT INTO order_items
     (order_id, product_id, item_name, quantity, price)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      orderId,
      item.product_id,
      productName,
      item.quantity,
      item.price
    ]
  );
}


    // 6️⃣ Clear cart
    await client.query(
      `DELETE FROM cart_items WHERE customer_id = $1`,
      [customerId]
    );

    await client.query("COMMIT");

    return {
      message: "Order placed successfully",
      orderId,
      orderCode,
      totalAmount
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
/* ================= GET CUSTOMER ORDERS ================= */
exports.getCustomerOrders = async (customerId) => {

  const result = await pool.query(
    `SELECT *
     FROM orders
     WHERE customer_id = $1
     ORDER BY created_at DESC`,
    [customerId]
  );

  return result.rows;
};

