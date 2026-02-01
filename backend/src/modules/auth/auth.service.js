const pool = require("../../config/database");

const { comparePassword } = require("../../utils/password.utils");

exports.vendorLogin = async ({ email, password }) => {
  const result = await pool.query(
    "SELECT * FROM vendors WHERE email=$1",
    [email]
  );

  if (result.rowCount === 0) throw "Vendor not found";

  const vendor = result.rows[0];

  if (!vendor.is_approved)
    throw "Approval pending";

  const match = await comparePassword(password, vendor.password);
  if (!match) throw "Invalid password";

  return vendor;
};
