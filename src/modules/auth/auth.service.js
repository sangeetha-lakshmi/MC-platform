const pool = require("../../config/database");
<<<<<<< HEAD:src/modules/auth/auth.service.js
const { comparePassword } = require("../../utils/password.utils");

exports.login = async ({ email, password }) => {
  // 1️⃣ ADMIN CHECK
  const adminResult = await pool.query(
    "SELECT * FROM admin_users WHERE email=$1",
    [email]
  );

  if (adminResult.rowCount > 0) {
    const admin = adminResult.rows[0];

    const match = await comparePassword(password, admin.password_hash);
    if (!match) throw "Invalid password";

    return { id: admin.id, role: "admin" };
  }

  // 2️⃣ VENDOR CHECK
  const vendorResult = await pool.query(
=======

const { comparePassword } = require("../../utils/password.utils");

exports.vendorLogin = async ({ email, password }) => {
  const result = await pool.query(
>>>>>>> 96a88c6302d9e55b2768e04e52cb7d98cfe1d494:backend/src/modules/auth/auth.service.js
    "SELECT * FROM vendors WHERE email=$1",
    [email]
  );

<<<<<<< HEAD:src/modules/auth/auth.service.js
  if (vendorResult.rowCount === 0) {
    throw "User not found";
  }

  const vendor = vendorResult.rows[0];

  if (!vendor.is_approved) {
    throw "Admin approval pending ⏳";
  }

  const match = await comparePassword(password, vendor.password_hash);
  if (!match) throw "Invalid password";

  return { id: vendor.id, role: "vendor" };
=======
  if (result.rowCount === 0) throw "Vendor not found";

  const vendor = result.rows[0];

  if (!vendor.is_approved)
    throw "Approval pending";

  const match = await comparePassword(password, vendor.password);
  if (!match) throw "Invalid password";

  return vendor;
>>>>>>> 96a88c6302d9e55b2768e04e52cb7d98cfe1d494:backend/src/modules/auth/auth.service.js
};
