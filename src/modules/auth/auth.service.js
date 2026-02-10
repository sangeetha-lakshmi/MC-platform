const pool = require("../../config/database");
const { comparePassword } = require("../../utils/password.utils");

exports.login = async ({ email, password }) => {
  // 1️⃣ ADMIN CHECK
  const adminResult = await pool.query(
    "SELECT id, password_hash FROM admin_users WHERE email = $1",
    [email]
  );

  if (adminResult.rowCount > 0) {
    const admin = adminResult.rows[0];

    const match = await comparePassword(password, admin.password_hash);
    if (!match) throw new Error("Invalid password");

    return { id: admin.id }; // ✅ ONLY ID
  }
  // 1️⃣.5 CUSTOMER CHECK 
  const customerResult = await pool.query(
    "SELECT id, password_hash FROM customers WHERE email = $1",
    [email]
  );

  if (customerResult.rowCount > 0) {
    const customer = customerResult.rows[0];

    const match = await comparePassword(password, customer.password_hash);
    if (!match) throw new Error("Invalid password");

    return { id: customer.id }; // ✅ ONLY ID
  }

  // 2️⃣ VENDOR CHECK
  const vendorResult = await pool.query(
    "SELECT id, password_hash, is_approved FROM vendors WHERE email = $1",
    [email]
  );

  if (vendorResult.rowCount === 0) {
    throw new Error("User not found");
  }

  const vendor = vendorResult.rows[0];

  if (!vendor.is_approved) {
    throw new Error("Admin approval pending");
  }

  const match = await comparePassword(password, vendor.password_hash);
  if (!match) throw new Error("Invalid credentials");

  return { id: vendor.id }; // ✅ ONLY ID
};
//customer register 
const { hashPassword } = require("../../utils/password.utils");

exports.registerCustomer = async ({
  name,
  email,
  password,
  latitude,
  longitude,
  address
}) => {

  // check existing customer
  const existing = await pool.query(
    "SELECT id FROM customers WHERE email = $1",
    [email]
  );

  if (existing.rowCount > 0) {
    throw new Error("Customer already exists");
  }

  const passwordHash = await hashPassword(password);

  await pool.query(
    `INSERT INTO customers
     (name, email, password_hash, latitude, longitude, address)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [name, email, passwordHash, latitude, longitude, address]
  );

  return true;
};
