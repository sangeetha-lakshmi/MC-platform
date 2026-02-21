const pool = require("../config/database");
const { sendOTP, verifyOTP } = require("../utils/twilio");

// SEND OTP
exports.sendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone required" });
    }

    await sendOTP(phone);

    res.json({ message: "OTP sent successfully" });

 } catch (err) {
    console.error("TWILIO ERROR:", err);  // 👈 ADD THIS
    res.status(500).json({ message: err.message }); // 👈 SHOW REAL ERROR
  }
};
exports.verifyCustomerOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const result = await verifyOTP(phone, otp);

    if (result.status !== "approved") {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await pool.query(
      `UPDATE app_data.customers
       SET phone_verified = true
       WHERE phone = $1`,
      [phone]
    );

    res.json({ message: "Phone verified successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.verifyVendorOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const result = await verifyOTP(phone, otp);

    if (result.status !== "approved") {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await pool.query(
      `UPDATE vendors
       SET phone_verified = true
       WHERE phone = $1`,
      [phone]
    );

    res.json({ message: "Phone verified successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};// VERIFY OTP
exports.verifyDeliveryOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const result = await verifyOTP(phone, otp);

    if (result.status !== "approved") {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await pool.query(
      `UPDATE delivery_partners
       SET phone_verified = true
       WHERE phone = $1`,
      [phone]
    );

    res.json({ message: "Phone verified successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
