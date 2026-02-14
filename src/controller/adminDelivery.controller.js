const pool = require("../config/database");
const bcrypt = require("bcrypt");
const generatePassword = require("../utils/generatePassword");
const generateProfileId = require("../utils/generateDeliveryid");


// 🔹 1. Get Delivery Partners (With Status Filter)
exports.getAlldelivery_partners = async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT *
      FROM delivery_partners
    `;
    let values = [];

    const validStatus = ["approved", "pending", "declined"];

    if (status && validStatus.includes(status)) {
      // If specific status provided
      query += " WHERE is_approved = $1";
      values.push(status);
    } else {
      // Default ALL view → exclude declined
      query += " WHERE is_approved != 'declined'";
    }

    query += " ORDER BY created_at DESC";

    const result = await pool.query(query, values);

    res.json({
      total: result.rows.length,
      data: result.rows,
    });

  } catch (error) {
    console.error("Get Deliveries Error:", error);
    res.status(500).json({ error: error.message });
  }
};



// 🔹 2. Approve Delivery
exports.approveDelivery = async (req, res) => {
  try {
    const { id } = req.params;

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
      tempPassword,
    });

  } catch (error) {
    console.error("Approve Delivery Error:", error);
    res.status(500).json({ error: error.message });
  }
};



// 🔹 3. Decline Delivery
exports.declineDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE delivery_partners
       SET is_approved = 'declined',
           is_active = false
       WHERE id = $1`,
      [id]
    );

    res.json({
      message: "Delivery Declined Successfully",
    });

  } catch (error) {
    console.error("Decline Delivery Error:", error);
    res.status(500).json({ error: error.message });
  }
};



// 🔹 4. Edit Profile ID
exports.editProfileId = async (req, res) => {
  try {
    const { id } = req.params;
    const { profile_id, tempPassword } = req.body;

    // 🔎 Check profile ID duplicate (if provided)
    if (profile_id) {
      const existing = await pool.query(
        "SELECT id FROM delivery_partners WHERE profile_id = $1 AND id != $2",
        [profile_id, id]
      );

      if (existing.rows.length > 0) {
        return res.status(400).json({
          message: "Profile ID already exists. Choose another.",
        });
      }
    }

    let query = `UPDATE delivery_partners SET `;
    let values = [];
    let updates = [];
    let index = 1;

    if (profile_id) {
      updates.push(`profile_id = $${index++}`);
      values.push(profile_id);
    }

    if (tempPassword) {
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      updates.push(`password_hash = $${index++}`);
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "Nothing to update",
      });
    }

    query += updates.join(", ");
    query += ` WHERE id = $${index}`;
    values.push(id);

    await pool.query(query, values);

    res.json({
      message: "Delivery profile updated successfully",
    });

  } catch (error) {
    console.error("Edit Profile Error:", error);
    res.status(500).json({ error: error.message });
  }
};


// 🔹 5. Delete Delivery (Hard Delete)
exports.deleteDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "DELETE FROM delivery_partners WHERE id = $1",
      [id]
    );

    res.json({
      message: "Delivery profile deleted",
    });

  } catch (error) {
    console.error("Delete Delivery Error:", error);
    res.status(500).json({ error: error.message });
  }
};



// 🔹 6. Reset Password
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
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: error.message });
  }
};