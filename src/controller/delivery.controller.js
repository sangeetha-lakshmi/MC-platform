const deliveryService = require("../modules/delivery/delivery.service");
const bcrypt = require("bcrypt");
const pool = require("../config/database"); // ✅ you forgot this

// 🔹 Register Delivery Partner
const registerDeliveryPartner = async (req, res) => {
  try {
    await deliveryService.register(req.body);

    res.status(201).json({
      message: "Delivery partner registered successfully. Await admin approval."
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

// 🔹 Change Password
const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE delivery_partners SET password_hash=$1 WHERE id=$2",
      [hashedPassword, req.params.id]
    );

    res.json({ message: "Password Updated Successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  registerDeliveryPartner,
  changePassword
};
