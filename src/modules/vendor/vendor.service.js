const db = require("../../config/database");

/* ---------------- CREATE VENDOR ---------------- */
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

/* ---------------- FIND VENDOR BY EMAIL ---------------- */
const findVendorByEmail = async (email) => {
  const result = await db.query(
    "SELECT * FROM vendors WHERE email = $1",
    [email]
  );
  return result.rows[0];
};
/* ---------------- UPDATE ORDER STATUS ---------------- */
const updateOrderStatus = async (orderId, status) => {

  const result = await db.query(
    `UPDATE orders
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, orderId]
  );

  return result.rows[0];
};

/* ✅ EXPORT ALL FUNCTIONS HERE */
module.exports = {
  createVendor,
  findVendorByEmail,
  updateOrderStatus
};
