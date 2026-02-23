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

   // Check if this is profile update (pending_phone exists)
const userCheck = await pool.query(
  `SELECT id, pending_phone 
   FROM app_data.customers
   WHERE pending_phone = $1 OR phone = $1`,
  [phone]
);

if (userCheck.rows.length === 0) {
  return res.status(400).json({ message: "User not found" });
}

const user = userCheck.rows[0];

if (user.pending_phone === phone) {
  // 🔥 PROFILE UPDATE CASE
  await pool.query(
    `UPDATE app_data.customers
     SET phone = pending_phone,
         pending_phone = NULL,
         phone_verified = true
     WHERE id = $1`,
    [user.id]
  );
} else {
  // 🔥 REGISTRATION CASE
  await pool.query(
    `UPDATE app_data.customers
     SET phone_verified = true
     WHERE phone = $1`,
    [phone]
  );
}

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

    // 🔎 Check if this phone exists as pending_phone
    const vendorCheck = await pool.query(
      `SELECT id, pending_phone 
       FROM vendors
       WHERE pending_phone = $1 OR phone = $1`,
      [phone]
    );

    if (vendorCheck.rows.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const vendor = vendorCheck.rows[0];

    if (vendor.pending_phone === phone) {
      // 🔥 PROFILE UPDATE CASE
      await pool.query(
        `UPDATE vendors
         SET phone = pending_phone,
             pending_phone = NULL,
             phone_verified = true
         WHERE id = $1`,
        [vendor.id]
      );
    } else {
      // 🔥 REGISTRATION CASE
      await pool.query(
        `UPDATE vendors
         SET phone_verified = true
         WHERE phone = $1`,
        [phone]
      );
    }

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

    // Check if phone exists in pending_phone OR phone column
    const deliveryCheck = await pool.query(
      `SELECT id, pending_phone
       FROM delivery_partners
       WHERE pending_phone = $1 OR phone = $1`,
      [phone]
    );

    if (deliveryCheck.rows.length === 0) {
      return res.status(404).json({
        message: "Delivery partner not found"
      });
    }

    const delivery = deliveryCheck.rows[0];

    if (delivery.pending_phone === phone) {
      // 🔥 PROFILE UPDATE CASE
      await pool.query(
        `UPDATE delivery_partners
         SET phone = pending_phone,
             pending_phone = NULL,
             phone_verified = true
         WHERE id = $1`,
        [delivery.id]
      );
    } else {
      // 🔥 REGISTRATION CASE
      await pool.query(
        `UPDATE delivery_partners
         SET phone_verified = true
         WHERE phone = $1`,
        [phone]
      );
    }

    res.json({ message: "Phone verified successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};