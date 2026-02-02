const pool = require("../config/db");

exports.getShops = async (req, res) => {
  try {
    const { status } = req.query;

    let whereClause = "";

    if (status === "pending") {
      whereClause = "is_approved = false AND rejected_reason IS NULL";
    } else if (status === "approved") {
      whereClause = "is_approved = true";
    } else if (status === "declined") {
      whereClause = "rejected_reason IS NOT NULL";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Use pending | approved | declined",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        id,
        restaurant_name,
        owner_name,
        email,
        phone,
        city,
        created_at,
        approved_at,
        rejected_reason
      FROM restaurants
      WHERE ${whereClause}
      ORDER BY created_at DESC
      `
    );

    res.status(200).json({
      success: true,
      status,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
