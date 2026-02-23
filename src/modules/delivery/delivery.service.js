const db = require("../../config/database");
const { sendOTP } = require("../../utils/twilio");
const calculateDistance = require("../../utils/distance");
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

 /* ================= DUPLICATE CHECKS ================= */

// 1️⃣ Email check
const emailCheck = await db.query(
  "SELECT id, phone, phone_verified FROM delivery_partners WHERE email = $1",
  [email]
);

if (emailCheck.rows.length > 0) {

  const existing = emailCheck.rows[0];

  // If not verified → resend OTP
  if (!existing.phone_verified) {
    await sendOTP(existing.phone);

    return {
      message: "Email already registered but not verified. OTP resent."
    };
  }

  throw new Error("Email already registered");
}


// 2️⃣ Phone check
const phoneCheck = await db.query(
  "SELECT id, phone_verified, is_approved FROM delivery_partners WHERE phone = $1",
  [phone]
);

if (phoneCheck.rows.length > 0) {

  const existing = phoneCheck.rows[0];

  // 🔹 If phone not verified → resend OTP
  if (!existing.phone_verified) {
    await sendOTP(phone);

    return {
      resendOTP: true,
      message: "Phone already registered but not verified. OTP resent."
    };
  }

  // 🔹 If verified but waiting admin approval
  if (existing.phone_verified && existing.is_approved === "pending") {
    throw new Error("Admin approval pending");
  }

  throw new Error("Phone number already registered");
}


// 3️⃣ Driving License check
const dlCheck = await db.query(
  "SELECT id FROM delivery_partners WHERE driving_license_number = $1",
  [driving_license_number]
);

if (dlCheck.rows.length > 0) {
  throw new Error("Driving license already registered");
}


// 4️⃣ Aadhar check
if (aadhar_number) {
  const aadharCheck = await db.query(
    "SELECT id FROM delivery_partners WHERE aadhar_number = $1",
    [aadhar_number]
  );

  if (aadharCheck.rows.length > 0) {
    throw new Error("Aadhar already registered");
  }
}


// 5️⃣ PAN check
if (pan_number) {
  const panCheck = await db.query(
    "SELECT id FROM delivery_partners WHERE pan_number = $1",
    [pan_number]
  );

  if (panCheck.rows.length > 0) {
    throw new Error("PAN already registered");
  }
}

  /* ================= GENERATE UNIQUE PROFILE ID ================= */

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
    phone_verified,
    is_approved,
    is_active,
    created_at)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,'pending',false,NOW())`,

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
  // 🔥 SEND OTP AFTER INSERT
await sendOTP(phone);

return {
  message: "OTP sent. Please verify your phone."
};
};


/* ================= GET AVAILABLE READY ORDERS ================= */
const getAvailableOrders = async () => {

  const result = await db.query(`
    SELECT 
      o.id,
      o.order_code,
      o.status,
      v.shop_name,
      v.address
    FROM orders o
    JOIN vendors v ON v.id = o.vendor_id
    WHERE o.status = 'ready'
    ORDER BY o.created_at ASC
  `);

  return result.rows;
};

//   return result.rows;
// };


/* ================= ACCEPT ORDER (STAGE 8) ================= */
const acceptOrder = async (orderId, deliveryPartnerId) => {

  // First check if order still ready
  const checkOrder = await db.query(
    `SELECT * FROM orders 
     WHERE id = $1 AND status = 'ready'`,
    [orderId]
  );

  if (checkOrder.rows.length === 0) {
    throw new Error("Order already accepted or not available");
  }

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
/* ================= MARK AS PICKED ================= */
const markAsPicked = async (orderId, deliveryPartnerId) => {

  const result = await db.query(`
  SELECT 
    o.id,
    o.order_code,
    o.total_amount,
    o.status,
    o.customer_id,
    v.shop_name,
    v.address,
    v.latitude,
    v.longitude
  FROM orders o
  JOIN vendors v ON v.id = o.vendor_id
  WHERE o.status = 'ready'
`);

  if (result.rows.length === 0) {
    throw new Error("Order not ready for pickup");
  }

  return result.rows[0];
};

const markAsDelivered = async (orderId, deliveryPartnerId) => {

  const result = await db.query(
    `UPDATE orders
     SET status = 'completed',
         updated_at = NOW()
     WHERE id = $1
       AND delivery_partner_id = $2
       AND status = 'picked'
     RETURNING *`,
    [orderId, deliveryPartnerId]
  );

  if (result.rows.length === 0) {
    throw new Error("Order not ready for completion");
  }

  return result.rows[0];
};

module.exports = {
  register,
  getAvailableOrders,
  acceptOrder,
  markAsPicked,
  markAsDelivered
};