const db = require("../../config/database");


/* ================= CREATE VENDOR ================= */
const createVendor = async ({
  shop_name,
  owner_name,
  email,
  phone,
  password_hash,
  business_type,
  address,
  latitude,
  longitude,
  opening_time,
  closing_time,
  shop_logo,
  license_doc
}) => {

  await db.query(
    `INSERT INTO vendors (
      shop_name,
      owner_name,
      email,
      phone,
      password_hash,
      business_type,
      address,
      latitude,
      longitude,
      opening_time,
      closing_time,
      shop_logo,
      license_doc,
      is_approved
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'pending'
    )`,
    [
      shop_name,
      owner_name,
      email,
      phone,
      password_hash,
      business_type,
      address,
      latitude,
      longitude,
      opening_time,
      closing_time,
      shop_logo,
      license_doc
    ]
  );
};


/* ================= FIND VENDOR BY EMAIL ================= */
const findVendorByEmail = async (email) => {
  const result = await db.query(
    "SELECT * FROM vendors WHERE email = $1",
    [email]
  );

  return result.rows[0];
};


/* ================= FIND VENDOR BY EMAIL OR PHONE (LOGIN FIX) ================= */
const findVendorByEmailOrPhone = async (identifier) => {
  const result = await db.query(
    `SELECT * 
     FROM vendors
     WHERE email = $1 OR phone = $1`,
    [identifier]
  );

  return result.rows[0];
};


/* ================= GET VENDOR INCOMING ORDERS (STAGE 3) ================= */
const getVendorOrders = async (vendorId) => {

  const result = await db.query(
    `SELECT *
     FROM orders
     WHERE vendor_id = $1
       AND status IN ('pending','accepted','preparing','ready')
     ORDER BY created_at DESC`,
    [vendorId]
  );

  return result.rows;
};


/* ================= UPDATE ORDER STATUS (SECURE VERSION) ================= */
const updateOrderStatus = async (orderId, status, vendorId) => {

  const result = await db.query(
    `UPDATE orders
     SET status = $1,
         updated_at = NOW()
     WHERE id = $2
       AND vendor_id = $3
     RETURNING *`,
    [status, orderId, vendorId]
  );

  return result.rows[0];
};


/* ================= EXPORT FUNCTIONS ================= */
module.exports = {
  createVendor,
  findVendorByEmail,
  findVendorByEmailOrPhone,
  getVendorOrders,
  updateOrderStatus
};
