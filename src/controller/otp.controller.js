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

// VERIFY OTP
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const { phone, otp, role } = req.body;

    if (!phone || !otp || !role) {
      return res.status(400).json({
        message: "Phone, OTP and role are required"
      });
    }

    const result = await verifyOTP(phone, otp);

    if (result.status !== "approved") {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    let table;

    if (role === "customer") table = "app_data.customers";
    else if (role === "vendor") table = "vendors";
    else if (role === "delivery_partner") table = "delivery_partners";
    else {
      return res.status(400).json({ message: "Invalid role" });
    }

    await pool.query(
      `UPDATE ${table}
       SET phone_verified = true
       WHERE phone = $1`,
      [phone]
    );

    res.json({ message: "Phone verified successfully" });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ message: "OTP verification failed" });
  }
};
