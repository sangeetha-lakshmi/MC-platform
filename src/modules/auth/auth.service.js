const pool = require("../../config/database");
const { comparePassword } = require("../../utils/password.utils");


exports.login = async ({ email, phone, password }) => {

  console.log("EMAIL:", email);
  console.log("PHONE:", phone);
  console.log("PASSWORD:", password);

  const adminResult = await pool.query(
    "SELECT id, password_hash FROM admin_users WHERE email = $1",
    [email]
  );

  console.log("Admin rowCount:", adminResult.rowCount);

  if (adminResult.rowCount > 0) {
    const admin = adminResult.rows[0];
    const match = await comparePassword(password, admin.password_hash);
    if (!match) throw new Error("Invalid password");

    return { id: admin.id, role: "admin" };
  }

  const identifier = email || phone;

  const customerResult = await pool.query(
    `SELECT id, password_hash 
     FROM app_data.customers 
     WHERE email = $1 OR phone = $1`,
    [identifier]
  );

  console.log("Customer rowCount:", customerResult.rowCount);

  if (customerResult.rowCount > 0) {
    const customer = customerResult.rows[0];
    const match = await comparePassword(password, customer.password_hash);
    if (!match) throw new Error("Invalid password");

    return { id: customer.id, role: "customer" };
  }

  const vendorResult = await pool.query(
    "SELECT id, password_hash, is_approved FROM vendors WHERE email = $1",
    [email]
  );

  console.log("Vendor rowCount:", vendorResult.rowCount);

  if (vendorResult.rowCount === 0) {
    throw new Error("User not found");
  }

  const vendor = vendorResult.rows[0];

  if (!vendor.is_approved) {
    throw new Error("Admin approval pending");
  }

  const match = await comparePassword(password, vendor.password_hash);
  if (!match) throw new Error("Invalid credentials");

  return { id: vendor.id, role: "vendor" };
};
