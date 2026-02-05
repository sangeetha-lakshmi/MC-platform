const pool = require("../../config/database");
const { comparePassword } = require("../../utils/password.utils");

exports.loginAdmin = async ({ email, password }) => {
  const result = await pool.query(
    "SELECT * FROM admin_users WHERE email=$1",
    [email]
  );

  if (result.rowCount === 0) throw "Invalid admin";

  const admin = result.rows[0];

  const match = await comparePassword(password, admin.password_hash);
  if (!match) throw "Invalid password";

  return admin;
};

/* ✅ Pending Vendors */
exports.getPendingVendors = async () => {
  const result = await pool.query(
    "SELECT id, owner_name, email, business_type, created_at FROM vendors WHERE is_approved = false"
  );
  return result.rows;
};

/* ✅ Approve Vendor */
exports.approveVendor = async (vendorId) => {
  return pool.query(
    "UPDATE vendors SET is_approved=true WHERE id=$1",
    [vendorId]
  );
};
//commiting
/* ❌ Decline vendor */
exports.declineVendor = async (vendorId) => {
  return pool.query(
    "UPDATE vendors SET is_approved = false WHERE id = $1",
    [vendorId]
  );
};

/* ✅ Get approved vendors */
exports.getApprovedVendors = async () => {
  const result = await pool.query(
    `SELECT
      id,
      shop_name,
      owner_name,
      email,
      phone,
      business_type,
      created_at
     FROM vendors
     WHERE is_approved = true`
  );

  return result.rows;
};
