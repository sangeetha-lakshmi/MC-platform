const bcrypt = require("bcrypt");
const db = require("../config/database.js");

async function createAdmin() {
  try {
    const email = "admin@gmail.com";
    const password = "admin123";

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)",
      [email, hash]
    );

    console.log(" Admin created successfully!");
    process.exit();
  } catch (err) {
    console.error(" Error:", err.message);
    process.exit(1);
  }
}

createAdmin();
