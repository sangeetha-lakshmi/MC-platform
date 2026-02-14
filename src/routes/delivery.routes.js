const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const deliveryController = require("../controller/delivery.controller");


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
router.get("/request/:id", async (req, res) => {

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
// Get all delivery_partners of a user
router.get("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, email, phone, vehicle_type, vehicle_number,
              profile_id, is_approved, is_active, created_at
       FROM delivery_partners
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Delivery Partner Not Found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("PROFILE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update Delivery Partner Profile
router.put("/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicle_type, vehicle_number } = req.body;

    const result = await pool.query(
      `UPDATE delivery_partners
       SET name = $1,
           phone = $2,
           vehicle_type = $3,
           vehicle_number = $4
       WHERE id = $5
       RETURNING id, name, email, phone, vehicle_type, vehicle_number,
                 profile_id, is_approved, is_active, created_at`,
      [name, phone, vehicle_type, vehicle_number, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Delivery Partner Not Found" });
    }

    res.json({
      message: "Profile Updated Successfully",
      data: result.rows[0]
    });

  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


router.post("/register", deliveryController.registerDeliveryPartner);

router.put("/change-password/:id", deliveryController.changePassword);

module.exports = router;

