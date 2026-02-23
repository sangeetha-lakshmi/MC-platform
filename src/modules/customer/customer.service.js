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
   UNIQUE ORDER CODE GENERATOR (Swiggy/Zomato style)
===================================================== */

async function generateUniqueOrderCode(client) {
  let code;
  let exists = true;

  while (exists) {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    code = `MS-ORD-${randomNumber}`;

    const result = await client.query(
      "SELECT 1 FROM orders WHERE order_code = $1",
      [code]
    );

    exists = result.rows.length > 0;
  }

  return code;
}

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
//HOME PAGE NEARBY
exports.getHomepageNearbyShops = async (customerId) => {

  // 🔹 1️⃣ Get customer location
  const locationQuery = `
    SELECT latitude, longitude
    FROM app_data.customers
    WHERE id = $1
  `;

  const locationResult =
    await pool.query(locationQuery, [customerId]);

  const location = locationResult.rows[0];

  if (!location || !location.latitude || !location.longitude) {
    throw new Error("Location not set");
  }

  // 🔹 2️⃣ Get nearby vendors directly
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
    WHERE distance <= 2
    ORDER BY distance ASC
  `;

  const result = await pool.query(query, [
    location.latitude,
    location.longitude
  ]);

  return result.rows;
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
      RETURNING id
    `;

    const updated = await pool.query(updateQuery, [
      quantity,
      customerId,
      productId
    ]);

     cartItemId = updated.rows[0].id;
  } else {

  // 4️⃣ Insert new cart item
  const insertQuery = `
    INSERT INTO cart_items (
      customer_id,
      vendor_id,
      product_id,
      quantity
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const inserted = await pool.query(insertQuery, [
    customerId,
    vendorId,
    productId,
    quantity
  ]);

  cartItemId = inserted.rows[0].id;
}
  // 🔹 Get full details of this cart item
  const detailsQuery = `
    SELECT
      ci.id AS cart_item_id,
      p.id AS product_id,
      p.name AS product_name,
      p.final_price AS price,
      ci.quantity,
      (p.final_price * ci.quantity) AS item_total,
      v.id AS vendor_id,
      v.shop_name
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    JOIN vendors v ON ci.vendor_id = v.id
    WHERE ci.id = $1
  `;

  const detailsRes = await pool.query(detailsQuery, [cartItemId]);
  const item = detailsRes.rows[0];

  // 🔹 Get updated cart summary
  const summaryQuery = `
    SELECT
      SUM(ci.quantity) AS total_items,
      SUM(p.final_price * ci.quantity) AS total_amount,
      COUNT(DISTINCT ci.vendor_id) AS total_shops
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.customer_id = $1
  `;

  const summaryRes = await pool.query(summaryQuery, [customerId]);
  const summary = summaryRes.rows[0];

  return {
    success: true,
    message: "Item added to cart",
    cartItem: {
      cartItemId: item.cart_item_id,
      productId: item.product_id,
      productName: item.product_name,
      price: Number(item.price),
      quantity: item.quantity,
      itemTotal: Number(item.item_total),
      vendorId: item.vendor_id,
      shopName: item.shop_name
    },
    cartSummary: {
      totalItems: Number(summary.total_items || 0),
      totalAmount: Number(summary.total_amount || 0),
      totalShops: Number(summary.total_shops || 0)
    }
  };
};
/* ================= GET CART ITEMS ================= */
// ================= GET CART (PRODUCTION LEVEL) =================
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
    ORDER BY v.id, ci.id DESC
  `;

  const result = await pool.query(query, [customerId]);
  const rows = result.rows;

  const grouped = {};
  let totalItems = 0;
  let totalAmount = 0;

  for (const item of rows) {

    if (!grouped[item.vendor_id]) {
      grouped[item.vendor_id] = {
        vendorId: item.vendor_id,
        shopName: item.vendor_name,
        items: [],
        shopTotal: 0
      };
    }

    grouped[item.vendor_id].items.push({
      cartItemId: item.cart_item_id,
      productId: item.product_id,
      productName: item.product_name,
      price: Number(item.price),
      quantity: item.quantity,
      itemTotal: Number(item.item_total)
    });

    grouped[item.vendor_id].shopTotal += Number(item.item_total);

    totalItems += item.quantity;
    totalAmount += Number(item.item_total);
  }

  return {
    success: true,
    cart: Object.values(grouped),
    cartSummary: {
      totalShops: Object.keys(grouped).length,
      totalItems,
      totalAmount
    }
  };
};
/* ================= PLACE ORDER ================= */
function getOrderStatusInfo(status, distanceKm) {

  let message = "Processing your order";
  let estimatedDeliveryTime = null;

  switch (status) {

    case "pending":
      message = "Order placed successfully";
      break;

    case "accepted":
      message = "Shop is preparing your order";
      break;

    case "ready":
      message = "Order is ready for pickup";
      break;

    case "picked_up":
      message = "Out for delivery";

      if (distanceKm !== undefined) {
        const travelTime = distanceKm * 5;
        estimatedDeliveryTime = `${Math.round(travelTime)} mins`;
      }
      break;

    case "delivered":
      message = "Delivered";
      break;
  }

  return { message, estimatedDeliveryTime };
}

exports.placeOrder = async ({ customerId }) => {

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Get cart items
    const cartRes = await client.query(
      `SELECT 
         c.product_id,
         c.quantity,
         c.vendor_id,
         p.price,
         p.name
       FROM cart_items c
       JOIN products p ON p.id = c.product_id
       WHERE c.customer_id = $1`,
      [customerId]
    );

    if (cartRes.rows.length === 0) {
      throw new Error("Cart is empty");
    }

    const items = cartRes.rows;

    // 2️⃣ Group items by vendor
    const grouped = {};

    for (const item of items) {
      if (!grouped[item.vendor_id]) {
        grouped[item.vendor_id] = [];
      }
      grouped[item.vendor_id].push(item);
    }

    const createdOrders = [];

    // 3️⃣ Create separate order for each vendor
    for (const vendorId in grouped) {

      const vendorItems = grouped[vendorId];

      const totalAmount = vendorItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const orderCode = await generateUniqueOrderCode(client);

      const orderRes = await client.query(
        `INSERT INTO orders
         (order_code, customer_id, vendor_id, total_amount, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING id`,
        [orderCode, customerId, vendorId, totalAmount]
      );

      const orderId = orderRes.rows[0].id;

      // Insert order items
      for (const item of vendorItems) {
        await client.query(
          `INSERT INTO order_items
           (order_id, product_id, item_name, quantity, price)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            orderId,
            item.product_id,
            item.name,
            item.quantity,
            item.price
          ]
        );
      }
      // 🔥 NEW PART STARTS HERE

  // Get shop name
  const shopRes = await client.query(
    `SELECT shop_name FROM vendors WHERE id = $1`,
    [vendorId]
  );

  const shopName = shopRes.rows[0]?.shop_name || "Shop";

  // Build items list
  const itemsList = vendorItems.map(
    item => `${item.name} x${item.quantity}`
  );

  const itemsCount = vendorItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Get message + ETA (pending → no ETA)
  const { message, estimatedDeliveryTime } =
    getOrderStatusInfo("pending");

  createdOrders.push({
    orderCode,
    shopName,
    items: itemsList,
    itemsCount,
    totalAmount,
    status: "pending",
    statusMessage: message,
    estimatedDeliveryTime
  });
}

    // 4️⃣ Clear cart
    await client.query(
      `DELETE FROM cart_items WHERE customer_id = $1`,
      [customerId]
    );

    await client.query("COMMIT");

    return {
      message: "Orders placed successfully",
      orders: createdOrders
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