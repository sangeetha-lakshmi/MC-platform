const pool = require("../config/db");
const bcrypt = require("bcrypt");

const createAdmin = async () => {
  const email = "admin@msplatform.com";
  const password = "Admin@123";

  const existing = await pool.query(
    "SELECT * FROM admins WHERE email=$1",
    [email]
  );

  if (existing.rows.length > 0) {
    console.log("Admin already exists ✅");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await pool.query(
    "INSERT INTO admins (name,email,password) VALUES ($1,$2,$3)",
    ["Super Admin", email, hashedPassword]
  );

  console.log("Default Admin Created ✅");
};

createAdmin();
