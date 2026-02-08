const bcrypt = require("bcrypt");
const db = require("../../config/database");

/* ---------------- ADMIN LOGIN ---------------- */
const loginAdmin = async ({ email, password }) => {
  const result = await db.query(
    "SELECT * FROM admin_users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid email or password");
  }

  const admin = result.rows[0];

  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return admin;
};

/* ---------------- PENDING VENDORS ---------------- */
const getPendingVendors = async () => {
 const result = await db.query(
  "SELECT * FROM vendors WHERE is_approved IS FALSE"
);
  return result.rows;
};

/* ---------------- APPROVE VENDOR ---------------- */
const approveVendor = async (vendorId) => {
  await db.query(
    "UPDATE vendors SET status = 'approved' WHERE id = $1",
    [vendorId]
  );
};

/* ---------------- CHANGE PASSWORD ---------------- */
const changePassword = async (adminId, currentPassword, newPassword) => {
  const result = await db.query(
    "SELECT password_hash FROM admin_users WHERE id = $1",
    [adminId]
  );

  if (result.rows.length === 0) {
    throw new Error("Admin not found");
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    result.rows[0].password_hash
  );

  if (!isMatch) {
    throw new Error("Current password incorrect");
  }

  const newHash = await bcrypt.hash(newPassword, 10);

  await db.query(
    "UPDATE admin_users SET password_hash = $1 WHERE id = $2",
    [newHash, adminId]
  );
};

/* ✅ Get Approved Vendors */
const getApprovedVendors = async () => {
  try {
    const result = await db.query(
      "SELECT * FROM vendors WHERE is_approved = true"
    );
    return result.rows;
  } catch (error) {
    console.error("DB ERROR (getApprovedVendors):", error.message);
    throw new Error("Failed to fetch approved vendors");
  }
};



module.exports = {
  loginAdmin,
  getPendingVendors,
  approveVendor,
  changePassword,
  getApprovedVendors
};
