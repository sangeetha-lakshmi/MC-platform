const pool = require("../../config/database");
const { comparePassword } = require("../../utils/password.utils");

exports.login = async ({ email, password }) => {
  // 1️⃣ ADMIN CHECK
  const adminResult = await pool.query(
    "SELECT * FROM admin_users WHERE email = $1",
    [email]
  );

  if (adminResult.rowCount > 0) {
    const admin = adminResult.rows[0];

    const match = await comparePassword(password, admin.password_hash);
    if (!match) throw "Invalid password";

    return {
      id: admin.id,
      role: "admin"
    };
  }

  // 2️⃣ VENDOR CHECK
  const vendorResult = await pool.query(
    "SELECT * FROM vendors WHERE email = $1",
    [email]
  );

  if (vendorResult.rowCount === 0) {
    throw "User not found";
  }

  const vendor = vendorResult.rows[0];

  if (!vendor.is_approved) {
    throw "Admin approval pending ";
  }

  const match = await comparePassword(password, vendor.password_hash);
  if (!match) throw "Invalid password";

  return {
    id: vendor.id,
    role: "vendor"
  };
};
//commiting