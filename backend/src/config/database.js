const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

/* ✅ Debug: Check connected database */
pool.query("SELECT current_database()", (err, res) => {
  if (err) {
    console.log("❌ DB Debug Error:", err.message);
  } else {
    console.log("✅ Connected Database:", res.rows[0].current_database);
  }
});

module.exports = pool;
