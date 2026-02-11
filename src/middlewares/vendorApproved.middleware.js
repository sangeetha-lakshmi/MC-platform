const pool = require("../config/database");

module.exports = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT is_approved FROM vendors WHERE id = $1",
      [req.user.id]
    );

    // ✅ Check if vendor exists
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vendor not found"
      });
    }

    // ✅ Check approval status
    if (!result.rows[0].is_approved) {
      return res.status(403).json({
        message: "Admin approval pending"
      });
    }

    next();
  } catch (error) {
    console.error("Vendor Approved Middleware Error:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
};
