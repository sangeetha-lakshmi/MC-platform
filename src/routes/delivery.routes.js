const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const deliveryController = require("../controller/delivery.controller");
const authMiddleware = require("../middlewares/auth.middleware");

/* ======================================================
   DELIVERY REQUEST CREATION (CUSTOMER)
====================================================== */

router.post("/request", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // 🔒 secure user from JWT

    const {
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
      [
        userId,
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
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("REQUEST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   GET DELIVERY REQUEST
====================================================== */

router.get("/request/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM delivery_requests WHERE request_id = $1",
      [id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error("GET REQUEST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   DRIVER ACCEPT ORDER
====================================================== */

router.put("/accept/:id", authMiddleware, async (req, res) => {
  try {

    if (req.user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id } = req.params;

    await pool.query(
      `UPDATE delivery_requests 
       SET status = 'DRIVER_ASSIGNED'
       WHERE request_id = $1`,
      [id]
    );

    res.json({ message: "Driver Assigned" });

  } catch (err) {
    console.error("ACCEPT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   UPDATE DELIVERY STATUS
====================================================== */

router.put("/status/:id", authMiddleware, async (req, res) => {
  try {

    if (req.user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = [
      "PENDING",
      "DRIVER_ASSIGNED",
      "PICKED_UP",
      "DELIVERED",
      "CANCELLED"
    ];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    await pool.query(
      "UPDATE delivery_requests SET status = $1 WHERE request_id = $2",
      [status, id]
    );

    res.json({ message: "Status Updated" });

  } catch (err) {
    console.error("STATUS UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ======================================================
   DELIVERY ACTIVE TOGGLE
====================================================== */

router.patch(
  "/toggle-active",
  authMiddleware,
  deliveryController.toggleActiveStatus
);

/* ======================================================
   GET DELIVERY PROFILE (SELF ONLY)
====================================================== */

router.get("/profile", authMiddleware, async (req, res) => {
  try {

    if (req.user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deliveryId = req.user.id;

    const result = await pool.query(
      `SELECT id, name, email, phone, vehicle_type, vehicle_number,
              profile_id, is_approved, is_active, created_at
       FROM delivery_partners
       WHERE id = $1`,
      [deliveryId]
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

/* ======================================================
   UPDATE DELIVERY PROFILE (SELF ONLY)
====================================================== */

router.put("/profile", authMiddleware, async (req, res) => {
  try {

    if (req.user.role !== "delivery_partner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const deliveryId = req.user.id;
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
      [name, phone, vehicle_type, vehicle_number, deliveryId]
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

/* ======================================================
   REGISTER DELIVERY
====================================================== */

router.post("/register", deliveryController.registerDeliveryPartner);

/* ======================================================
   CHANGE PASSWORD (SELF ONLY)
====================================================== */

router.put(
  "/change-password",
  authMiddleware,
  deliveryController.changePassword
);

module.exports = router;
