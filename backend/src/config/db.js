const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// test connection
pool.query("SELECT 1")
  .then(() => console.log("✅ Neon DB connected successfully"))
  .catch(err => console.error("❌ Neon DB error", err));

module.exports = pool;
