const { Pool } = require("pg");
require("dotenv").config();

<<<<<<< HEAD:src/config/database.js
console.log("🔍 DATABASE_URL =", process.env.DATABASE_URL);

=======
>>>>>>> 96a88c6302d9e55b2768e04e52cb7d98cfe1d494:backend/src/config/database.js
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

<<<<<<< HEAD:src/config/database.js
=======
/* ✅ Debug: Check connected database */
>>>>>>> 96a88c6302d9e55b2768e04e52cb7d98cfe1d494:backend/src/config/database.js
pool.query("SELECT current_database()", (err, res) => {
  if (err) {
    console.log("❌ DB Debug Error:", err.message);
  } else {
    console.log("✅ Connected Database:", res.rows[0].current_database);
  }
});

module.exports = pool;
