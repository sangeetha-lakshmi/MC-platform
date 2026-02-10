const express = require("express");
const router = express.Router();
const pool = require("../config/database");


router.post("/request", async (req, res) => {
  const {
    user_id,
    pickup_lat,
    pickup_lng,
    pickup_instructions,
    receiver_name,
    receiver_phone,
    drop_lat,
    drop_lng,
    drop_address_text,
    package_type,
    weight,
    item_value,
    is_fragile,
    payment_method
  } = req.body;

  const result = await pool.query(
    `INSERT INTO delivery_requests
    (user_id,pickup_lat,pickup_lng,pickup_instructions,receiver_name,receiver_phone,
     drop_lat,drop_lng,drop_address_text,package_type,weight,item_value,is_fragile,payment_method)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING *`,
    [user_id,pickup_lat,pickup_lng,pickup_instructions,receiver_name,receiver_phone,
     drop_lat,drop_lng,drop_address_text,package_type,weight,item_value,is_fragile,payment_method]
  );

  res.json(result.rows[0]);
});
// Get delivery details
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM delivery_requests WHERE request_id = $1",
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
// Driver accepts order
router.put("/accept/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE delivery_requests SET status = 'DRIVER_ASSIGNED' WHERE request_id = $1",
      [id]
    );

    res.json({ message: "Driver Assigned" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// Update delivery status
router.put("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.query(
      "UPDATE delivery_requests SET status = $1 WHERE request_id = $2",
      [status, id]
    );

    res.json({ message: "Status Updated" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
// Get all deliveries of a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      "SELECT * FROM delivery_requests WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
