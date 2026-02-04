const { Pool } = require("pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error(" DATABASE_URL is missing");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Safe DB test (won’t crash app)
pool
  .query("SELECT 1")
  .then(() => console.log(" Connected to Neon database"))
  .catch((err) =>
    console.error(" Neon DB connection error:", err.message)
  );

module.exports = pool;
