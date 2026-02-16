const pool = require("../../config/database");
const { comparePassword } = require("../../utils/password.utils");

exports.login = async ({ email, phone, profile_id, password }) => {

  const identifier = email || phone || profile_id;


  /* ================= ADMIN CHECK ================= */
  const adminResult = await pool.query(
    "SELECT id, password_hash FROM admin_users WHERE email = $1",
    [email]
  );

  if (adminResult.rowCount > 0) {
    const admin = adminResult.rows[0];

    const match = await comparePassword(password, admin.password_hash);


    if (!match) throw new Error("Invalid password");

    return { id: admin.id, role: "admin" };
  }

  /* ================= DELIVERY PARTNER CHECK ================= */
  const deliveryResult = await pool.query(
    `SELECT id, password_hash, is_approved, is_active
     FROM delivery_partners
     WHERE email = $1 OR phone = $1 OR profile_id = $1`,
    [identifier]
  );

  if (deliveryResult.rowCount > 0) {
    const partner = deliveryResult.rows[0];


    if (partner.is_approved !== "approved") {
      throw new Error("Admin approval pending");
    }

    if (!partner.is_active) {
      throw new Error("Account is inactive");
    }

    if (!partner.password_hash) {
      throw new Error("Password not set by admin yet");
    }

    const match = await comparePassword(password, partner.password_hash);

  

    if (!match) throw new Error("Invalid password");

    return { id: partner.id, role: "delivery_partner" };
  }

  /* ================= CUSTOMER CHECK ================= */
  const customerResult = await pool.query(
    `SELECT id, password_hash 
     FROM app_data.customers 
     WHERE email = $1 OR phone = $1`,
    [identifier]
  );

  if (customerResult.rowCount > 0) {
    const customer = customerResult.rows[0];

    const match = await comparePassword(password, customer.password_hash);


    if (!match) throw new Error("Invalid password");

    return { id: customer.id, role: "customer" };
  }

  /* ================= VENDOR CHECK ================= */
  const vendorResult = await pool.query(
    "SELECT id, password_hash, is_approved FROM vendors WHERE email = $1",
    [identifier]
  );

  if (vendorResult.rowCount > 0) {
    const vendor = vendorResult.rows[0];

    if (vendor.is_approved !== "approved") {
      throw new Error("Admin approval pending");
    }

    const match = await comparePassword(password, vendor.password_hash);
   

    if (!match) throw new Error("Invalid password");

    return { id: vendor.id, role: "vendor" };
  }

return { id: vendor.id, role: "vendor" };
};
const { hashPassword } = require("../../utils/password.utils");

exports.registerCustomer = async (data) => {
  const {
    name,
    email,
    phone,
    password,
    latitude,
    longitude,
    address
  } = data;

  // 🔹 Duplicate check (email OR phone)
  const existing = await pool.query(
    `SELECT id
     FROM app_data.customers
     WHERE (email = $1 AND $1 IS NOT NULL)
        OR (phone = $2 AND $2 IS NOT NULL)`,
    [email ?? null, phone ?? null]
  );

  if (existing.rowCount > 0) {
    throw new Error("Customer already exists");
  }

  // 🔹 Hash password
  const passwordHash = await hashPassword(password);

  // 🔹 Insert customer
  await pool.query(
    `INSERT INTO app_data.customers
     (name, email, phone, password_hash, latitude, longitude, address)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      name,
      email ?? null,
      phone ?? null,
      passwordHash,
      latitude ?? null,
      longitude ?? null,
      address ?? null
    ]
  );

  return true;
};
