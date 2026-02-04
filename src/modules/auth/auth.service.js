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
    if (!match) throw new Error("Invalid credentials");

    return { id: admin.id }; // ✅ ONLY ID
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
