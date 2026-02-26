const db = require("../../config/database");
const { sendOTP } = require("../../utils/twilio");
const calculateDistance = require("../../utils/distance");
const { getIO } = require("../../config/socket");

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
    throw new Error("Either Aadhar or PAN required");

  if (!vehicle_type) throw new Error("Vehicle type required");
  if (!vehicle_number) throw new Error("Vehicle number required");
  if (!driving_license_number)
    throw new Error("Driving license required");

  if (!/^[0-9]{10}$/.test(phone))
    throw new Error("Phone must be 10 digits");

  const dlRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
  if (!dlRegex.test(driving_license_number))
    throw new Error("Invalid DL format");

  /* ================= DUPLICATE CHECKS ================= */

  const emailCheck = await db.query(
    "SELECT id, phone, phone_verified FROM delivery_partners WHERE email=$1",
    [email]
  );

  if (emailCheck.rows.length > 0) {
    const existing = emailCheck.rows[0];
    if (!existing.phone_verified) {
      await sendOTP(existing.phone);
      return { message: "OTP resent" };
    }
    throw new Error("Email already registered");
  }

  const phoneCheck = await db.query(
    "SELECT id, phone_verified FROM delivery_partners WHERE phone=$1",
    [phone]
  );

  if (phoneCheck.rows.length > 0) {
    const existing = phoneCheck.rows[0];
    if (!existing.phone_verified) {
      await sendOTP(phone);
      return { message: "OTP resent" };
    }
    throw new Error("Phone already registered");
  }

  /* ================= CREATE PROFILE ID ================= */

  let profileId;
  let exists = true;

  while (exists) {
    profileId =
      name.toLowerCase().replace(/\s+/g, "") +
      Math.floor(1000 + Math.random() * 9000);

    const check = await db.query(
      "SELECT id FROM delivery_partners WHERE profile_id=$1",
      [profileId]
    );

    exists = check.rows.length > 0;
  }

  await db.query(
    `INSERT INTO delivery_partners
     (name,email,phone,aadhar_number,pan_number,
      vehicle_type,vehicle_number,driving_license_number,
      profile_id,phone_verified,is_approved,is_active,created_at)
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

  await sendOTP(phone);

  return { message: "OTP sent" };
};

/* ================= GET READY ORDERS NEAR DELIVERY ================= */
const getAvailableOrders = async (deliveryPartnerId, radiusKm = 2) => {

  const delivery = await db.query(
    "SELECT latitude, longitude FROM delivery_partners WHERE id=$1",
    [deliveryPartnerId]
  );

  const { latitude: dLat, longitude: dLng } = delivery.rows[0];

  const result = await db.query(`
    SELECT o.id, v.shop_name, v.address, v.latitude, v.longitude
    FROM orders o
    JOIN vendors v ON v.id = o.vendor_id
    WHERE o.status = 'ready'
  `);

  const nearbyOrders = result.rows
    .map(order => {
      const distance = parseFloat(
        calculateDistance(dLat, dLng, order.latitude, order.longitude)
      );
      return { ...order, distance_km: distance };
    })
    .filter(order => order.distance_km <= radiusKm);

  return nearbyOrders;
};

/* ================= AGENT ACCEPT ORDER ================= */
const acceptOrder = async (orderId, deliveryPartnerId) => {

  const result = await db.query(`
    UPDATE orders
    SET delivery_partner_id = $1,
        status = 'assigned'
    WHERE id = $2
      AND delivery_partner_id IS NULL
    RETURNING *
  `, [deliveryPartnerId, orderId]);

  if (result.rowCount === 0) {
    throw new Error("Order already assigned or not found");
  }

  return result.rows[0];
};

/* ================= MARK PICKED ================= */
const markAsPicked = async (orderId, deliveryPartnerId) => {

  const result = await db.query(
    `UPDATE orders
     SET status='picked', updated_at=NOW()
     WHERE id=$1 AND delivery_partner_id=$2
     AND status='out_for_delivery'
     RETURNING id, customer_id`,
    [orderId, deliveryPartnerId]
  );

  if (result.rows.length === 0)
    throw new Error("Order not ready");

  return result.rows[0];
};

/* ================= MARK DELIVERED ================= */
const markAsDelivered = async (orderId, deliveryPartnerId) => {

  const result = await db.query(
    `UPDATE orders
     SET status='completed', updated_at=NOW()
     WHERE id=$1 AND delivery_partner_id=$2
     AND status='picked'
     RETURNING id, customer_id`,
    [orderId, deliveryPartnerId]
  );

  if (result.rows.length === 0)
    throw new Error("Order not ready");

  return result.rows[0];
};

/* ================= FIND NEAREST FREE AGENTS ================= */
async function findNearestFreeAgents(lat, lng) {

  const result = await db.query(`
    SELECT dp.id, dp.latitude, dp.longitude,
      (
        6371 * acos(
          cos(radians($1)) *
          cos(radians(dp.latitude)) *
          cos(radians(dp.longitude) - radians($2)) +
          sin(radians($1)) *
          sin(radians(dp.latitude))
        )
      ) AS distance
    FROM delivery_partners dp
    WHERE dp.is_active = TRUE
      AND dp.latitude IS NOT NULL
      AND dp.longitude IS NOT NULL
      AND dp.id NOT IN (
        SELECT delivery_partner_id
        FROM orders
        WHERE status IN (
          'assigned',
          'ready',
          'picked',
          'out_for_delivery'
        )
      )
    HAVING distance <= 2
    ORDER BY distance ASC
  `, [lat, lng]);

  return result.rows;
}

/* ================= SEQUENTIAL ASSIGNMENT ================= */
async function assignToNextAgent(orderId, agents, index = 0) {

  if (index >= agents.length) {
    console.log("❌ No agents accepted");
    return;
  }

  const agent = agents[index];
  const io = getIO();

  console.log("Trying agent:", agent.id);

  io.to(`delivery_${agent.id}`)
    .emit("delivery_request", { orderId });

  // ⏱️ 20 seconds timeout
  setTimeout(async () => {

    const check = await db.query(
      "SELECT delivery_partner_id FROM orders WHERE id=$1",
      [orderId]
    );

    if (!check.rows[0].delivery_partner_id) {
      console.log("No response → next agent");
      assignToNextAgent(orderId, agents, index + 1);
    }

  }, 20000);
};

/* ================= EXPORTS ================= */
module.exports = {
  register,
  getAvailableOrders,
  acceptOrder,
  markAsPicked,
  markAsDelivered,
  findNearestFreeAgents,
  assignToNextAgent
};