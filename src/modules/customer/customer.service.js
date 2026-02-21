const pool = require("../../config/database");

/* =====================================================
   SAFE DISTANCE FORMULA
===================================================== */

const DIST = `
6371 * acos(
  LEAST(
    1,
    GREATEST(
      -1,
      cos(radians($1))
      * cos(radians(v.latitude))
      * cos(radians(v.longitude) - radians($2))
      + sin(radians($1))
      * sin(radians(v.latitude))
    )
  )
)
`;

/* =====================================================
   NEARBY VENDORS BY CATEGORY + SUBCATEGORY
===================================================== */

exports.getNearbyVendorsByCategoryAndSubCategory = async ({
  customerLat,
  customerLng,
  category,
  subCategory,
  radius = 2
}) => {

  const query = `
    SELECT *
    FROM (
      SELECT
        v.id AS vendor_id,
        v.shop_name,
        ROUND((${DIST})::numeric, 2) AS distance,
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
        AND p.subcategory = $4
        AND p.is_live = true
        AND v.is_online = true
        AND v.is_approved = 'approved'
        AND v.latitude IS NOT NULL
        AND v.longitude IS NOT NULL
      GROUP BY v.id
    ) AS results
    WHERE distance <= $5
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


/* =====================================================
   NEARBY VENDORS
===================================================== */

exports.getNearbyVendors = async ({
  customerLat,
  customerLng,
  radius = 2
}) => {

  const query = `
    SELECT *
    FROM (
      SELECT
        v.id,
        v.shop_name,
        v.business_type,
        v.latitude,
        v.longitude,
        ROUND((${DIST})::numeric, 2) AS distance
      FROM vendors v
      WHERE
        v.is_approved = 'approved'
        AND v.is_online = true
        AND v.latitude IS NOT NULL
        AND v.longitude IS NOT NULL
    ) AS results
    WHERE distance <= $3
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    customerLat,
    customerLng,
    radius
  ]);

  return result.rows;
};


/* =====================================================
   SEARCH SHOP BY NAME (UNCHANGED)
===================================================== */

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


/* =====================================================
   SHOPS BY CATEGORY
===================================================== */

exports.getShopsByCategory = async ({
  customerLat,
  customerLng,
  category,
  radius = 2
}) => {

  const query = `
    SELECT *
    FROM (
      SELECT
        v.id,
        v.shop_name,
        v.business_type,
        ROUND((${DIST})::numeric, 2) AS distance
      FROM vendors v
      WHERE
        v.business_type = $3
        AND v.is_approved = 'approved'
        AND v.is_online = true
        AND v.latitude IS NOT NULL
        AND v.longitude IS NOT NULL
    ) AS results
    WHERE distance <= $4
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


/* =====================================================
   VEG / NON-VEG SHOPS
===================================================== */

exports.getVegNonVegShops = async ({
  customerLat,
  customerLng,
  foodType,
  radius = 2
}) => {

  const query = `
    SELECT *
    FROM (
      SELECT DISTINCT
        v.id,
        v.shop_name,
        ROUND((${DIST})::numeric, 2) AS distance
      FROM vendors v
      JOIN products p ON p.vendor_id = v.id
      WHERE
        p.food_type = $3
        AND p.is_live = true
        AND v.is_approved = 'approved'
        AND v.is_online = true
        AND v.latitude IS NOT NULL
        AND v.longitude IS NOT NULL
    ) AS results
    WHERE distance <= $4
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


/* =====================================================
   CATEGORIES WITH SUBCATEGORIES (UNCHANGED)
===================================================== */

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
    ORDER BY c.id
  `;

  const result = await pool.query(query);

  return result.rows;
};


/* =====================================================
   SUBCATEGORIES BY CATEGORY (UNCHANGED)
===================================================== */

exports.getSubCategoriesByCategory = async (categoryId) => {

  const query = `
    SELECT id, name, icon
    FROM app_data.sub_categories
    WHERE category_id = $1
      AND is_active = TRUE
    ORDER BY id
  `;

  const result = await pool.query(query, [categoryId]);

  return result.rows;
};
//push by sangeetha
exports.getHomepageNearbyShops = async (customerId) => {

  // 🔹 Get customer location
  const locationQuery = `
    SELECT latitude, longitude
    FROM app_data.customers
    WHERE id = $1
  `;

  const locationResult = await pool.query(locationQuery, [customerId]);

  const location = locationResult.rows[0];

  if (!location || !location.latitude || !location.longitude) {
    throw new Error("Location not set");
  }

  // 🔹 Use your existing nearby vendors function
  const shops = await exports.getNearbyVendors({
    customerLat: location.latitude,
    customerLng: location.longitude
  });

  return shops;
};
exports.saveCustomerLocation = async ({
  customerId,
  latitude,
  longitude
}) => {

  const query = `
    UPDATE app_data.customers
    SET latitude = $1,
        longitude = $2
    WHERE id = $3
  `;

  await pool.query(query, [
    latitude,
    longitude,
    customerId
  ]);
};
// ADD TO CART 
exports.addToCart = async ({ customerId, productId, quantity }) => {

  // 1️⃣ Get vendor from product table
  const productQuery = `
    SELECT vendor_id
    FROM products
    WHERE id = $1 AND is_live = true
  `;

  const product = await pool.query(productQuery, [productId]);

  if (product.rows.length === 0) {
    throw new Error("Product not available");
  }

  const vendorId = product.rows[0].vendor_id;

  // 2️⃣ Check existing cart item
  const checkQuery = `
    SELECT *
    FROM cart_items
    WHERE customer_id = $1
      AND product_id = $2
  `;

  const existing = await pool.query(checkQuery, [customerId, productId]);

  // 3️⃣ If exists → update qty
  if (existing.rows.length > 0) {

    const updateQuery = `
      UPDATE cart_items
      SET quantity = quantity + $1
      WHERE customer_id = $2
        AND product_id = $3
      RETURNING *
    `;

    const updated = await pool.query(updateQuery, [
      quantity,
      customerId,
      productId
    ]);

    return updated.rows[0];
  }

  // 4️⃣ Insert new cart item
  const insertQuery = `
    INSERT INTO cart_items (
      customer_id,
      vendor_id,
      product_id,
      quantity
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;

  const inserted = await pool.query(insertQuery, [
    customerId,
    vendorId,
    productId,
    quantity
  ]);

  return inserted.rows[0];
};
/* ================= GET CART ITEMS ================= */
exports.getCartItems = async (customerId) => {

  const query = `
    SELECT
      ci.id AS cart_item_id,
      ci.product_id,
      ci.vendor_id,
      ci.quantity,
      p.name AS product_name,
      p.final_price AS price,
      (p.final_price * ci.quantity) AS item_total,
      v.shop_name AS vendor_name
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN vendors v ON ci.vendor_id = v.id
    WHERE ci.customer_id = $1
    ORDER BY ci.id DESC
  `;

  const result = await pool.query(query, [customerId]);

  return result.rows;
};
/* ================= PLACE ORDER ================= */
exports.placeOrder = async ({ customerId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Get cart items WITH vendor_id + price
    const cartRes = await client.query(
      `SELECT 
         c.product_id,
         c.quantity,
         c.vendor_id,
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

    // 2️⃣ Get vendor_id (cart already restricted to one vendor)
    const vendorId = items[0].vendor_id;

    // 3️⃣ Calculate total
    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // 4️⃣ Generate order code
    const orderCode = "ORD-" + Date.now();

    // 5️⃣ Insert order WITH vendor_id
    const orderRes = await client.query(
      `INSERT INTO orders
       (order_code, customer_id, vendor_id, total_amount, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [orderCode, customerId, vendorId, totalAmount]
    );

    const orderId = orderRes.rows[0].id;

    // 6️⃣ Insert order items
    for (const item of items) {

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

    // 7️⃣ Clear cart
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