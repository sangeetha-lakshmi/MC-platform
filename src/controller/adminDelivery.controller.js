const pool = require("../config/database");
const bcrypt = require("bcrypt");
const generatePassword = require("../utils/generatePassword");
const generateProfileId = require("../utils/generateDeliveryid");


/* =====================================================
   1️⃣ GET ALL DELIVERY PARTNERS (WITH STATUS FILTER)
===================================================== */
exports.getAlldelivery_partners = async (req, res) => {
  try {
    const { status } = req.query;

    let values = [];
    let query = `
      SELECT *
      FROM delivery_partners
      WHERE phone_verified = true
    `;

    const validStatus = ["approved", "pending", "declined"];

    if (status && validStatus.includes(status)) {
      query += " AND is_approved = $1";
      values.push(status);
    } else {
      query += " AND is_approved != 'declined'";
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);

    res.json({
      total: result.rowCount,
      data: result.rows
    });

  } catch (error) {
    console.error("Get Deliveries Error:", error);
    res.status(500).json({ error: error.message });
  }
};


/* =====================================================
   2️⃣ APPROVE DELIVERY PARTNER
===================================================== */
exports.approveDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const userCheck = await pool.query(
      "SELECT name FROM delivery_partners WHERE id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "Delivery Partner Not Found" });
    }

    const name = userCheck.rows[0].name;

    const profileId = generateProfileId(name);
    const tempPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      `UPDATE delivery_partners
       SET profile_id = $1,
           password_hash = $2,
           is_approved = 'approved',
           is_active = true
       WHERE id = $3`,
      [profileId, hashedPassword, id]
    );

    res.json({
      message: "Delivery Approved Successfully ✅",
      profileId,
      tempPassword
    });

  } catch (error) {
    console.error("Approve Delivery Error:", error);
    res.status(500).json({ error: error.message });
  }
};


/* =====================================================
   3️⃣ DECLINE DELIVERY PARTNER
===================================================== */
exports.declineDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const userCheck = await pool.query(
      "SELECT id FROM delivery_partners WHERE id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: "Delivery Partner Not Found" });
    }

    await pool.query(
      `UPDATE delivery_partners
       SET is_approved = 'declined',
           is_active = false
       WHERE id = $1`,
      [id]
    );

    res.json({
      message: "Delivery Declined Successfully ❌"
    });

  } catch (error) {
    console.error("Decline Delivery Error:", error);
    res.status(500).json({ error: error.message });
  }
};


/* =====================================================
   4️⃣ EDIT DELIVERY PASSWORD
===================================================== */
exports.editDeliveryPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    console.log("ID RECEIVED:", id);
    console.log("NEW PASSWORD:", newPassword);

    if (!newPassword) {
      return res.status(400).json({
        message: "New password is required"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await pool.query(
      "UPDATE delivery_partners SET password_hash = $1 WHERE id = $2 RETURNING id",
      [hashedPassword, id]
    );

    console.log("Rows Updated:", result.rowCount);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "No delivery partner found with this ID"
      });
    }

    res.json({
      message: "Password Updated Successfully ✅"
    });

  } catch (error) {
    console.error("Edit Password Error:", error);
    res.status(500).json({ error: error.message });
  }
};



/* =====================================================
   5️⃣ RESET DELIVERY PASSWORD
===================================================== */
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const userCheck = await pool.query(
      "SELECT id FROM delivery_partners WHERE id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Delivery Partner Not Found"
      });
    }

    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE delivery_partners SET password_hash = $1 WHERE id = $2",
      [hashedPassword, id]
    );

    res.json({
      message: "Password Reset Successful 🔄",
      newPassword
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: error.message });
  }
};


/* =====================================================
   6️⃣ DELETE DELIVERY PARTNER
===================================================== */
exports.deleteDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const userCheck = await pool.query(
      "SELECT id FROM delivery_partners WHERE id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Delivery Partner Not Found"
      });
    }

    await pool.query(
      "DELETE FROM delivery_partners WHERE id = $1",
      [id]
    );

    res.json({
      message: "Delivery Profile Deleted 🗑️"
    });

  } catch (error) {
    console.error("Delete Delivery Error:", error);
    res.status(500).json({ error: error.message });
  }
};


/* =====================================================
   7️⃣ GET DELIVERY PARTNER BY ID
===================================================== */
exports.getDeliveryById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, phone,
              vehicle_type, vehicle_number,
              profile_id, is_approved, is_active
       FROM delivery_partners
       WHERE id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Delivery Partner Not Found"
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Get Delivery By ID Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};





console.log("Admin Delivery Controller Loaded:", Object.keys(module.exports));
