const db = require("../../config/database");

/* ================= REGISTER DELIVERY PARTNER ================= */
const register = async (data) => {

  const {
    name,
    email,
    phone,
    aadhar_number,
    pan_number,
    vehicle_type,
    vehicle_number,
    driving_license_number
  } = data;

  if (!name) throw new Error("Name is required");
  if (!email) throw new Error("Email is required");
  if (!phone) throw new Error("Phone number is required");

  if (!aadhar_number && !pan_number)
    throw new Error("Either Aadhar number or PAN number is required");

  if (!vehicle_type) throw new Error("Vehicle type is required");
  if (!vehicle_number) throw new Error("Vehicle number is required");
  if (!driving_license_number)
    throw new Error("Driving license number is required");

  if (!/^[0-9]{10}$/.test(phone))
    throw new Error("Phone number must contain 10 digits only");

  const dlRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
  if (!dlRegex.test(driving_license_number))
    throw new Error("Invalid driving license number format");

  if (pan_number) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan_number))
      throw new Error("Invalid PAN format");
  }

  if (aadhar_number) {
    const aadharRegex = /^[0-9]{12}$/;
    if (!aadharRegex.test(aadhar_number))
      throw new Error("Invalid Aadhar format");
  }

  const duplicateCheck = await db.query(
    `SELECT id FROM delivery_partners 
     WHERE email = $1 
        OR phone = $2
        OR driving_license_number = $3
        OR aadhar_number = $4
        OR pan_number = $5`,
    [
      email,
      phone,
      driving_license_number,
      aadhar_number || null,
      pan_number || null
    ]
  );

  if (duplicateCheck.rows.length > 0)
    throw new Error(
      "Duplicate record detected (Email / Phone / DL / Aadhar / PAN)"
    );

  let profileId;
  let exists = true;

  while (exists) {
    profileId =
      name.toLowerCase().replace(/\s+/g, "") +
      Math.floor(1000 + Math.random() * 9000);

    const checkProfile = await db.query(
      "SELECT id FROM delivery_partners WHERE profile_id = $1",
      [profileId]
    );

    exists = checkProfile.rows.length > 0;
  }

  await db.query(
    `INSERT INTO delivery_partners
     (name,email,phone,
      aadhar_number,pan_number,
      vehicle_type,vehicle_number,
      driving_license_number,
      profile_id,
      is_approved, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',NOW())`,
    [
      name,
      email,
      phone,
      aadhar_number || null,
      pan_number || null,
      vehicle_type,
      vehicle_number,
      driving_license_number,
      profileId
    ]
  );
};


/* ================= GET AVAILABLE READY ORDERS ================= */
const getAvailableOrders = async () => {

  const result = await db.query(
    `SELECT 
        o.id,
        o.order_code,
        o.total_amount,
        o.status,
        o.created_at,
        v.shop_name,
        v.address
     FROM orders o
     JOIN vendors v ON v.id = o.vendor_id
     WHERE o.status = 'ready'
     ORDER BY o.created_at ASC`
  );

  return result.rows;
};


/* ================= ACCEPT ORDER (STAGE 8) ================= */
const acceptOrder = async (orderId, deliveryPartnerId) => {

  const result = await db.query(
    `UPDATE orders
     SET status = 'out_for_delivery',
         delivery_partner_id = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [deliveryPartnerId, orderId]
  );

  return result.rows[0];
};


/* ================= STAGE 9 - MARK ORDER COMPLETED ================= */
const markAsDelivered = async (orderId, deliveryPartnerId) => {

  const result = await db.query(
    `UPDATE orders
     SET status = 'completed',
         updated_at = NOW()
     WHERE id = $1
       AND delivery_partner_id = $2
     RETURNING *`,
    [orderId, deliveryPartnerId]
  );

  return result.rows[0];
};


module.exports = {
  register,
  getAvailableOrders,
  acceptOrder,
  markAsDelivered
};
