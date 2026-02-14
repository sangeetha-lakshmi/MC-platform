const bcrypt = require("bcrypt");
const db = require("../../config/database");

/* ---------------- ADMIN LOGIN ---------------- */
const loginAdmin = async ({ email, password }) => {
  const result = await db.query(
    "SELECT * FROM admin_users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const admin = result.rows[0];

  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return admin;
};

/* ---------------- PENDING VENDORS ---------------- */
const getPendingVendors = async () => {
  const result = await db.query(
    "SELECT * FROM vendors WHERE is_approved = 'pending'"
  );
  return result.rows;
};

/* ---------------- APPROVE VENDOR ---------------- */
const approveVendor = async (vendorId) => {
  await db.query(
    "UPDATE vendors SET is_approved = 'approved' WHERE id = $1",
    [vendorId]
  );
};

/* ---------------- DECLINE VENDOR ---------------- */
const declineVendor = async (vendorId) => {
  await db.query(
    "UPDATE vendors SET is_approved = 'declined' WHERE id = $1",
    [vendorId]
  );
};



/* ---------------- CHANGE PASSWORD ---------------- */
const changePassword = async (adminId, currentPassword, newPassword) => {
  const result = await db.query(
    "SELECT password_hash FROM admin_users WHERE id = $1",
    [adminId]
  );

  if (result.rows.length === 0) {
    throw new Error("Admin not found");
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    result.rows[0].password_hash
  );

  if (!isMatch) {
    throw new Error("Current password incorrect");
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await db.query(
    "UPDATE admin_users SET password_hash = $1 WHERE id = $2",
    [newHash, adminId]
  );
};

/* ---------------- APPROVED VENDORS ---------------- */
const getApprovedVendors = async () => {
  const result = await db.query(
    "SELECT * FROM vendors WHERE is_approved = 'approved'"
  );
  return result.rows;
};

/* ---------------- DECLINED VENDORS ---------------- */
const getDeclinedVendors = async () => {
  const result = await db.query(
    "SELECT * FROM vendors WHERE is_approved = 'declined'"
  );
  return result.rows;
};


// 1️⃣ Category Count
const getCategoryCount = async () => {
  const result = await db.query(`
    SELECT business_type, COUNT(*) AS shop_count
    FROM vendors
    WHERE is_approved = 'approved'
    GROUP BY business_type
    ORDER BY business_type;
  `);

  return result.rows;
};

// 2️⃣ Get Shops (All or Filtered)
// 2️⃣ Get Shops (All or Filtered) WITH PRODUCT COUNT
const getShops = async (category) => {
  let query = `
    SELECT 
      v.id,
      v.shop_name,
      v.email,
      v.business_type,
      COUNT(p.id) AS product_count
    FROM vendors v
    LEFT JOIN products p 
      ON v.id = p.vendor_id
    WHERE v.is_approved = 'approved'
  `;

  const values = [];

  if (category) {
    query += ` AND v.business_type = $1`;
    values.push(category);
  }

  query += `
    GROUP BY v.id
    ORDER BY v.created_at DESC
  `;

  const result = await db.query(query, values);
  return result.rows;
};


// 3️⃣ Get Single Shop
const getShopById = async (id) => {
  const result = await db.query(
    `SELECT id, shop_name, email, business_type
     FROM vendors
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

// 4️⃣ Get Products of Shop
const getShopProducts = async (vendorId) => {
  const result = await db.query(
    `SELECT 
        id,
        name,
        price,
        final_price,
        stock,
        is_live,
        category,
        preparing_minutes,
        food_type,
        subcategory
     FROM products
     WHERE vendor_id = $1
     ORDER BY id DESC`,
    [vendorId]
  );

  return result.rows;
};




// 5️⃣ Toggle Product
const toggleProduct = async (productId) => {
  const result = await db.query(
    `UPDATE products
     SET is_live = NOT is_live,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, is_live`,
    [productId]
  );

  if (result.rows.length === 0) {
    throw new Error("Product not found");
  }

  return result.rows[0];
};


module.exports = {
loginAdmin,
  getPendingVendors,
  approveVendor,
  declineVendor,
  changePassword,
  getApprovedVendors,
  getDeclinedVendors, 
  getCategoryCount,
  getShops,
  getShopById,
  getShopProducts, 
  toggleProduct
};
