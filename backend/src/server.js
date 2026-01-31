const app = require("./app");
const pool = require("./config/db"); // ✅ Import pool
require("dotenv").config();

const PORT = process.env.PORT || 5000;

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
