const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const pool = require("../config/database");
const transporter = require("../config/email");
const { hashPassword, comparePassword } = require("../utils/password.utils");

/* ================= REGISTER ================= */

exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // Check if email already exists
    const existing = await pool.query(
      `SELECT id FROM app_data.customers WHERE email = $1`,
      [email]
    );

    if (existing.rowCount > 0) {
      return res.status(400).json({
        message: "Customer already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    await pool.query(
      `INSERT INTO app_data.customers 
       (name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)`,
      [name, email, phone ?? null, hashedPassword]
    );

    res.status(201).json({
      message: "Customer registered successfully",
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGIN ================= */

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const result = await pool.query(
      `SELECT id, password_hash 
       FROM app_data.customers 
       WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result.rows[0];

    const isMatch = await comparePassword(
      password,
      user.password_hash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FORGOT PASSWORD ================= */

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const result = await pool.query(
      `SELECT id FROM app_data.customers WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Email not found",
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving (more secure)
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await pool.query(
      `UPDATE app_data.customers
       SET reset_token = $1,
           reset_token_expiry = $2
       WHERE email = $3`,
      [hashedToken, expiry, email]
    );

    const resetLink = `http://localhost:5000/api/auth/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Password",
      html: `
        <h3>Password Reset</h3>
        <p>This link is valid for 15 minutes.</p>
        <a href="${resetLink}">Reset Password</a>
      `,
    });

    res.json({
      message: "Reset link sent to email",
    });

  } catch (error) {
    console.error("FORGOT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password required",
      });
    }

    // Hash token to match DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const result = await pool.query(
      `SELECT id, reset_token_expiry 
       FROM app_data.customers 
       WHERE reset_token = $1`,
      [hashedToken]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    const user = result.rows[0];

    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({
        message: "Token expired",
      });
    }

    const hashedPassword = await hashPassword(newPassword);

    await pool.query(
      `UPDATE app_data.customers
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expiry = NULL
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({
      message: "Password reset successful",
    });

  } catch (error) {
    console.error("RESET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY OTP ================= */

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // If you are not using OTP system yet
    return res.status(400).json({
      message: "OTP verification not implemented yet"
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= VERIFY RESET TOKEN ================= */

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: "Token is required"
      });
    }

    const hashedToken = require("crypto")
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const result = await pool.query(
      `SELECT id, reset_token_expiry
       FROM app_data.customers
       WHERE reset_token = $1`,
      [hashedToken]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        message: "Invalid token"
      });
    }

    const user = result.rows[0];

    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({
        message: "Token expired"
      });
    }

    res.json({
      message: "Token is valid"
    });

  } catch (error) {
    console.error("VERIFY RESET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

