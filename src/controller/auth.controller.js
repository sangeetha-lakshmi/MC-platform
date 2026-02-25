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
    const { name, email, phone, password,latitude,longitude } = req.body;

  if (!name || !password || (!email && !phone)) {
    return res.status(400).json({
      message: "Name, password and email or phone are required"
    });
  }
  // 🔥 NEW — Location mandatory
if (latitude === undefined || longitude === undefined) {
  return res.status(400).json({
    message: "Location (latitude & longitude) is required"
  });
}
  try {

  const result = await authService.registerCustomer(req.body);

  // 🔥 If resend required
  if (result?.resendOTP) {
    return res.status(200).json({
      message: "Phone already registered but not verified. OTP resent."
    });
  }

  // 🔥 If service returned custom message (OTP case or email case)
  if (result?.message) {
    return res.status(201).json(result);
  }

} catch (err) {

  if (err.message === "Customer already registered") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: err.message });
}

};


/* ================= CUSTOMER UPDATE ================= */

exports.updateCustomerProfile = async (req, res) => {
  try {

    // 🔥 IMPORTANT — ID FROM JWT TOKEN
    const id = req.user.id;

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

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0]
    });

  } catch (err) {

    console.log("UPDATE ERROR:", err.message);

    res.status(500).json({ message: err.message });
  }
};


const crypto = require("crypto");

exports.forgotPassword = async (req, res) => {
  const { email, phone } = req.body;

  try {
    if (!email && !phone) {
      return res.status(400).json({
        message: "Email or phone is required"
      });
    }

    const tables = [
      "vendors",
      "app_data.customers",
      "delivery_partners"
    ];

    let tableFound = null;
    let userId = null;

    /* ================= IDENTIFY USER ================= */
    for (let table of tables) {
      const result = await pool.query(
        email
          ? `SELECT id FROM ${table} WHERE email=$1`
          : `SELECT id FROM ${table} WHERE phone=$1`,
        [email || phone]
      );

      if (result.rowCount > 0) {
        tableFound = table;
        userId = result.rows[0].id;
        break;
      }
    }

    if (!tableFound) {
      return res.status(404).json({ message: "Account not found" });
    }

    /* ================= PHONE FLOW (HEADER TOKEN) ================= */
    if (phone) {

      await sendOTP(phone);

      // 🔐 Create OTP session token (5 mins)
      const otpSessionToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );

      res.setHeader("x-otp-session", otpSessionToken);

      return res.json({
        message: "OTP sent successfully"
      });
    }

    /* ================= EMAIL FLOW (UNCHANGED) ================= */
    if (email) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        `UPDATE ${tableFound}
         SET reset_token=$1,
             reset_token_expiry=$2
         WHERE email=$3`,
        [token, expiry, email]
      );

      const resetLink = `http://localhost:3000/reset-password?token=${token}`;

      await transporter.sendMail({
        to: email,
        subject: "Reset Your Password",
        html: `
          <h3>Password Reset</h3>
          <p>This link is valid for 15 minutes.</p>
          <a href="${resetLink}">Click here to reset password</a>
        `
      });

      return res.json({
        message: "Reset link sent to registered email"
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


exports.verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const otpSessionToken = req.headers["x-otp-session"];

  try {

    if (!otpSessionToken) {
      return res.status(400).json({
        message: "OTP session token missing"
      });
    }

    const decoded = jwt.verify(
      otpSessionToken,
      process.env.JWT_SECRET
    );

    const userId = decoded.id;

    const tables = [
      "vendors",
      "app_data.customers",
      "delivery_partners"
    ];

    let phone = null;

    for (let table of tables) {
      const result = await pool.query(
        `SELECT phone FROM ${table} WHERE id=$1`,
        [userId]
      );

      if (result.rowCount > 0) {
        phone = result.rows[0].phone;
        break;
      }
    }

    if (!phone) {
      return res.status(404).json({
        message: "Account not found"
      });
    }

    const response = await verifyTwilioOTP(phone, otp);

    if (response.status !== "approved") {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

    // 🔐 Create Reset Token (10 mins)
    const resetToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.setHeader("x-reset-token", resetToken);

    return res.json({
      message: "OTP verified successfully"
    });

  } catch (error) {
    return res.status(400).json({
      message: "Invalid or expired OTP session"
    });
  }
};

exports.resetPassword = async (req, res) => {

  const { token, password, confirmPassword } = req.body;
  const resetTokenHeader = req.headers["x-reset-token"];

  try {

    if (!password || !confirmPassword) {
      return res.status(400).json({ message: "Password required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const tables = [
      "vendors",
      "app_data.customers",
      "delivery_partners"
    ];

    let tableFound = null;

    /* ================= EMAIL TOKEN RESET (BODY TOKEN) ================= */
    if (token) {

      for (let table of tables) {
        const result = await pool.query(
          `SELECT id FROM ${table}
           WHERE reset_token=$1
           AND reset_token_expiry > NOW()`,
          [token]
        );

        if (result.rowCount > 0) {
          tableFound = table;
          break;
        }
      }

      if (!tableFound) {
        return res.status(400).json({
          message: "Invalid or expired reset link"
        });
      }

      const hashedPassword = await hashPassword(password);

      await pool.query(
        `UPDATE ${tableFound}
         SET password_hash=$1,
             reset_token=NULL,
             reset_token_expiry=NULL
         WHERE reset_token=$2`,
        [hashedPassword, token]
      );

      return res.json({
        message: "Password reset successful"
      });
    }

    /* ================= PHONE OTP RESET (HEADER TOKEN ONLY) ================= */
    if (resetTokenHeader) {

      let decoded;

      try {
        decoded = jwt.verify(
          resetTokenHeader,
          process.env.JWT_SECRET
        );
      } catch (err) {
        return res.status(400).json({
          message: "Invalid or expired reset token"
        });
      }

      const userId = decoded.id;

      for (let table of tables) {
        const result = await pool.query(
          `SELECT id FROM ${table} WHERE id=$1`,
          [userId]
        );

        if (result.rowCount > 0) {
          tableFound = table;
          break;
        }
      }

      if (!tableFound) {
        return res.status(404).json({
          message: "Account not found"
        });
      }

      const hashedPassword = await hashPassword(password);

      await pool.query(
        `UPDATE ${tableFound}
         SET password_hash=$1
         WHERE id=$2`,
        [hashedPassword, userId]
      );

      return res.json({
        message: "Password reset successful"
      });
    }

    return res.status(400).json({
      message: "Reset token required"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};