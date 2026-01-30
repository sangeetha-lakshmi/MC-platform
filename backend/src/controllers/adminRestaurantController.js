const pool = require("../config/db");


// ✅ 1. Get All Pending Restaurants
exports.getPendingRestaurants = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, restaurant_name, owner_name, email, phone, city, created_at FROM restaurants WHERE is_approved = false AND rejected_reason IS NULL"
    );

    res.json({
      message: "Pending restaurant applications ⏳",
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ 2. Approve Restaurant
exports.approveRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.id;

    await pool.query(
      `UPDATE restaurants 
       SET is_approved = true, approved_at = NOW() 
       WHERE id=$1`,
      [restaurantId]
    );

    res.json({ message: "Restaurant approved successfully ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ 3. Reject Restaurant (With Reason)
exports.rejectRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const { reason } = req.body;

    await pool.query(
      `UPDATE restaurants 
       SET rejected_reason=$1 
       WHERE id=$2`,
      [reason, restaurantId]
    );

    res.json({ message: "Restaurant rejected ❌", reason });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
