const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
<<<<<<< HEAD
});

// test connection
pool.query("SELECT 1")
  .then(() => console.log("✅ Neon DB connected successfully"))
  .catch(err => console.error("❌ Neon DB error", err));
=======
  ssl: {
    rejectUnauthorized: false,
  },
});

>>>>>>> 116b5f4d18765cdf939d8b280eb29f6783c52337

module.exports = pool;
