const { Pool } = require("pg");
require("dotenv").config();

// Optional: log DB URL for debugging (can remove later)
console.log("🔍 DATABASE_URL =", process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Debug: confirm which database is connected
pool.query("SELECT current_database()", (err, res) => {
  if (err) {
    console.log("❌ DB Debug Error:", err.message);
  } else {
    console.log("✅ Connected Database:", res.rows[0].current_database);
  }
});

module.exports = pool;
