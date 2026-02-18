const jwt = require("jsonwebtoken");
const authService = require("../modules/auth/auth.service");
const transporter = require("../config/email");
const { sendOTP, verifyOTP: verifyTwilioOTP } = require("../utils/twilio");
const { hashPassword } = require("../utils/password.utils");
const pool = require("../config/database");

exports.login = async (req, res) => {
  try {
    const user = await authService.login(req.body);



    // 🔐 Create JWT
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const decoded = jwt.decode(token);
    console.log("Token Expiry:", new Date(decoded.exp * 1000));

    res.status(200).json({
      message: "Login successful",
      token
    });

  } catch (err) {

    console.log("LOGIN ERROR:", err.message);

    // ✅ Proper Error Handling

    if (err.message === "User not found") {
      return res.status(404).json({ message: "Account not found" });
    }

    if (err.message === "Invalid password") {
      return res.status(401).json({ message: "Incorrect password" });
    }

    if (err.message === "Admin approval pending") {
      return res.status(403).json({ message: "Admin approval pending" });
    }

    if (err.message === "Account is inactive") {
      return res.status(403).json({ message: "Account is inactive" });
    }

    if (err.message === "Password not set by admin yet") {
      return res.status(403).json({ message: "Password not set by admin yet" });
    }

    // 🔥 Show real error instead of generic
    return res.status(500).json({ message: err.message });
  }
};


/* ================= CUSTOMER REGISTER ================= */

exports.registerCustomer = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !password || (!email && !phone)) {
    return res.status(400).json({
      message: "Name, password and email or phone are required"
    });
  }

  try {
    await authService.registerCustomer(req.body);

    res.status(201).json({
      message: "Customer registered successfully"
    });

  } catch (err) {

    console.log("REGISTER ERROR:", err.message);

    if (err.message === "Customer already exists") {
      return res.status(400).json({ message: err.message });
    }

    return res.status(500).json({ message: err.message });
  }
};


/* ================= CUSTOMER UPDATE ================= */

exports.updateCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, password } = req.body;

    let query;
    let values;

    if (password) {
      const bcrypt = require("bcrypt");
      const hashedPassword = await bcrypt.hash(password, 10);

      query = `
        UPDATE app_data.customers
        SET name=$1, phone=$2, address=$3, password_hash=$4
        WHERE id=$5
        RETURNING id,name,phone,address,email
      `;

      values = [name, phone, address, hashedPassword, id];

    } else {

      query = `
        UPDATE app_data.customers
        SET name=$1, phone=$2, address=$3
        WHERE id=$4
        RETURNING id,name,phone,address,email
      `;

      values = [name, phone, address, id];
    }

    const result = await pool.query(query, values);

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0]
    });

  } catch (err) {

    console.log("UPDATE ERROR:", err.message);

    res.status(500).json({ message: err.message });
  }
};



exports.forgotPassword = async (req, res) => {
  const { email, phone } = req.body;

  try {

    /* ================= EMAIL FLOW ================= */
    if (email) {
      const user = await pool.query(
        "SELECT * FROM users WHERE email=$1",
        [email]
      );

      if (user.rows.length === 0)
        return res.status(404).json({ message: "User not found" });

      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      await pool.query(
        `UPDATE users 
         SET reset_token=$1, reset_token_expiry=$2
         WHERE email=$3`,
        [token, expiry, email]
      );

      const resetLink = `http://localhost:3000/reset-password/${token}`;

      await transporter.sendMail({
        to: email,
        subject: "Reset Your Password",
        html: `
          <h3>Password Reset</h3>
          <p>Click below link to reset password:</p>
          <a href="${resetLink}">${resetLink}</a>
        `
      });

      return res.json({ message: "Reset link sent to email" });
    }

    /* ================= PHONE FLOW ================= */
    if (phone) {
      const user = await pool.query(
        "SELECT * FROM users WHERE phone=$1",
        [phone]
      );

      if (user.rows.length === 0)
        return res.status(404).json({ message: "User not found" });

      await sendOTP(phone);

      return res.json({ message: "OTP sent to phone" });
    }

    return res.status(400).json({ message: "Email or Phone required" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


exports.verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const response = await verifyTwilioOTP(phone, otp);

    if (response.status !== "approved")
      return res.status(400).json({ message: "Invalid OTP" });

    await pool.query(
      "UPDATE users SET otp_verified=true WHERE phone=$1",
      [phone]
    );

    res.json({ message: "OTP verified successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.resetPassword = async (req, res) => {
  const { token, phone, password, confirmPassword } = req.body;

  try {

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const hashedPassword = await hashPassword(password);

    /* ================= EMAIL RESET ================= */
    if (token) {
      const user = await pool.query(
        `SELECT * FROM users 
         WHERE reset_token=$1 
         AND reset_token_expiry > NOW()`,
        [token]
      );

      if (user.rows.length === 0)
        return res.status(400).json({ message: "Invalid or expired token" });

      await pool.query(
        `UPDATE users 
         SET password=$1,
             reset_token=NULL,
             reset_token_expiry=NULL
         WHERE reset_token=$2`,
        [hashedPassword, token]
      );

      return res.json({ message: "Password reset successful (Email)" });
    }

    /* ================= PHONE RESET ================= */
    if (phone) {
      const user = await pool.query(
        `SELECT * FROM users 
         WHERE phone=$1 AND otp_verified=true`,
        [phone]
      );

      if (user.rows.length === 0)
        return res.status(400).json({ message: "OTP not verified" });

      await pool.query(
        `UPDATE users 
         SET password=$1,
             otp_verified=false
         WHERE phone=$2`,
        [hashedPassword, phone]
      );

      return res.json({ message: "Password reset successful (Phone)" });
    }

    return res.status(400).json({ message: "Token or phone required" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
