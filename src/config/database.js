const { Pool } = require("pg");
require("dotenv").config();

// Check if DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing");
}

// Create pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Safe DB test (won’t crash app)
pool
  .query("SELECT 1")
  .then(() => console.log("✅ Connected to Neon database"))
  .catch((err) =>
    console.error("❌ Neon DB connection error:", err.message)
  );

// Optional debug: confirm which database is connected
pool.query("SELECT current_database()", (err, res) => {
  if (err) {
    console.log("❌ DB Debug Error:", err.message);
  } else {
    console.log("✅ Connected Database:", res.rows[0].current_database);
  }
});

module.exports = pool;
