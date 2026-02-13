const pool = require("../config/database");
const bcrypt = require("bcrypt");
const generatePassword = require("../utils/generatePassword");
const generateProfileId = require("../utils/generateDeliveryid");



// 🔹 1. Get All Delivery Partners
exports.getAlldelivery_partners = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM delivery_partners ORDER BY created_at DESC"
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

    // Get delivery name first
    const result = await pool.query(
      "SELECT name FROM delivery_partners WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Delivery not found" });
    }

    const name = result.rows[0].name;

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
      message: "Delivery Approved Successfully",
      profileId,
      tempPassword
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


 
// 🔹 Edit Profile ID
exports.editProfileId = async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id } = req.body;

    // Check if profile_id already exists
    const existing = await pool.query(
      "SELECT * FROM delivery_partners WHERE profile_id = $1",
      [profile_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Profile ID already exists. Choose another."
      });
    }

    await pool.query(
      `UPDATE delivery_partners
       SET profile_id = $1
       WHERE id = $2`,
      [profile_id, id]
    );

    res.json({
      message: "Profile ID updated successfully"
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
      "DELETE FROM delivery_partners WHERE id = $1",
      [id]
    );

    res.json({ message: "Delivery profile deleted" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// 🔹 4. Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE delivery_partners SET password_hash = $1 WHERE id = $2",
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
