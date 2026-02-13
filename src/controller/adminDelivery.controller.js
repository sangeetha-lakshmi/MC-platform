const pool = require("../config/database");
const bcrypt = require("bcrypt");
const generateDeliveryId = require("../utils/generateDeliveryid");
const generatePassword = require("../utils/generatePassword");


// 🔹 1. Get All Deliveries (Admin View)
exports.getAllDeliveries = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM deliveries ORDER BY created_at DESC"
    );

    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 🔹 2. Approve Delivery
exports.approveDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryId = generateDeliveryId();
    const tempPassword = generatePassword();

    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      `UPDATE deliveries 
       SET delivery_id=$1, password=$2, status='APPROVED'
       WHERE id=$3`,
      [deliveryId, hashedPassword, id]
    );

    res.json({
      message: "Delivery Approved",
      deliveryId,
      tempPassword, // show once to admin
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 🔹 3. Delete Delivery
exports.deleteDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM deliveries WHERE id=$1",
      [id]
    );

    res.json({ message: "Delivery profile deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 🔹 4. Reset Password (Optional)
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE deliveries SET password=$1 WHERE id=$2",
      [hashedPassword, id]
    );

    res.json({
      message: "Password Reset Successful",
      newPassword,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
