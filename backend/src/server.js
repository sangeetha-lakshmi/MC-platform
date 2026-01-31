<<<<<<< HEAD
=======
const app = require("./app");
const pool = require("./config/db"); // ✅ Import pool
>>>>>>> 116b5f4d18765cdf939d8b280eb29f6783c52337
require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;

<<<<<<< HEAD
// Only listen locally
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
  });
}

// Export for Vercel
module.exports = app;
=======
// ✅ Test DB Route FIRST
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      message: "Database Connected Successfully ✅",
      time: result.rows[0],
    });
  } catch (error) {
    console.log("DB Error:", error);
    res.status(500).json({ message: "Database Connection Failed ❌" });
  }
});

// ✅ Start Server AFTER routes
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
>>>>>>> 116b5f4d18765cdf939d8b280eb29f6783c52337
