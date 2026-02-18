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

/* ---------------- CATEGORY COUNT ---------------- */
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

/* ---------------- GET SHOPS ---------------- */
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

/* ---------------- GET SINGLE SHOP ---------------- */
const getShopById = async (id) => {
  const result = await db.query(
    `SELECT id, shop_name, email, business_type
     FROM vendors
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

/* ---------------- GET SHOP PRODUCTS ---------------- */
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

/* ---------------- TOGGLE PRODUCT ---------------- */
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

/* ---------------- SYSTEM SETTINGS (CREATE / UPDATE) ---------------- */
const saveOrUpdateSystemSettings = async ({
  platform_name,
  support_email,
  contact_number,
  default_currency,
  timezone
}) => {

  const existing = await db.query(
    "SELECT * FROM system_settings LIMIT 1"
  );

  if (existing.rows.length > 0) {

    const result = await db.query(
      `UPDATE system_settings
       SET platform_name = $1,
           support_email = $2,
           contact_number = $3,
           default_currency = $4,
           timezone = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        platform_name,
        support_email,
        contact_number,
        default_currency,
        timezone,
        existing.rows[0].id
      ]
    );

    return result.rows[0];

  } else {

    const result = await db.query(
      `INSERT INTO system_settings
       (platform_name, support_email, contact_number, default_currency, timezone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        platform_name,
        support_email,
        contact_number,
        default_currency,
        timezone
      ]
    );

    return result.rows[0];
  }
};

/* ---------------- PLATFORM SETTINGS (CREATE / UPDATE) ---------------- */
const saveOrUpdatePlatformSettings = async ({
  enable_shop_registration,
  enable_orders,
  maintenance_mode,
  commission_percentage
}) => {

  const existing = await db.query(
    "SELECT * FROM platform_settings LIMIT 1"
  );

  if (existing.rows.length > 0) {

    const result = await db.query(
      `UPDATE platform_settings
       SET enable_shop_registration = $1,
           enable_orders = $2,
           maintenance_mode = $3,
           commission_percentage = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        enable_shop_registration,
        enable_orders,
        maintenance_mode,
        commission_percentage,
        existing.rows[0].id
      ]
    );

    return result.rows[0];

  } else {

    const result = await db.query(
      `INSERT INTO platform_settings
       (enable_shop_registration, enable_orders, maintenance_mode, commission_percentage)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        enable_shop_registration,
        enable_orders,
        maintenance_mode,
        commission_percentage
      ]
    );

    return result.rows[0];
  }
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
  toggleProduct,
  saveOrUpdateSystemSettings,
  saveOrUpdatePlatformSettings
};
