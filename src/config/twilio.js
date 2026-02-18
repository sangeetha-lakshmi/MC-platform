const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const validator = require("validator");

const pool = require("../config/database");
const transporter = require("../config/email");
const client = require("../config/twilio");

const { hashPassword, comparePassword } = require("../utils/password.utils");

/* ================= HELPER ================= */

function getTable(role) {
  if (role === "customer") return "app_data.customers";
  if (role === "vendor") return "app_data.vendors";
  if (role === "delivery") return "app_data.delivery_partners";
  return null;
}

/* ================= LOGIN ================= */

exports.login = async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password || !role)
      return res.status(400).json({ message: "All fields required" });

    const table = getTable(role);
    if (!table)
      return res.status(400).json({ message: "Invalid role" });

    const result = await pool.query(
      `SELECT id, password_hash
       FROM ${table}
       WHERE email=$1 OR phone=$1`,
      [identifier]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "User not found" });

    const user = result.rows[0];

    const match = await comparePassword(password, user.password_hash);
    if (!match)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FORGOT PASSWORD ================= */

exports.forgotPassword = async (req, res) => {
  try {
    const { identifier, role } = req.body;

    if (!identifier || !role)
      return res.status(400).json({ message: "Identifier and role required" });

    const table = getTable(role);
    if (!table)
      return res.status(400).json({ message: "Invalid role" });

    const result = await pool.query(
      `SELECT id FROM ${table}
       WHERE email=$1 OR phone=$1`,
      [identifier]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ message: "User not found" });

    const isEmail = validator.isEmail(identifier);

    /* ===== EMAIL RESET FLOW ===== */
    if (isEmail) {

      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 15 * 60 * 1000);

      await pool.query(
        `UPDATE ${table}
         SET reset_token=$1,
             reset_token_expiry=$2
         WHERE email=$3`,
        [token, expiry, identifier]
      );

      const resetLink =
        `http://localhost:3000/reset-password?token=${token}&role=${role}`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: identifier,
        subject: "Reset Your Password",
        html: `
          <h3>Password Reset</h3>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
          <p>This link expires in 15 minutes.</p>
        `
      });

      return res.json({ message: "Reset link sent to email" });
    }

    /* ===== OTP RESET FLOW ===== */
    else {

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 5 * 60 * 1000);

      await pool.query(
        `UPDATE ${table}
         SET otp=$1,
             otp_expiry=$2
         WHERE phone=$3`,
        [otp, expiry, identifier]
      );

      await client.messages.create({
        body: `Your OTP is ${otp}`,
        from: process.env.TWILIO_PHONE,
        to: identifier
      });

      return res.json({ message: "OTP sent to phone" });
    }

  } catch (error) {
    console.error("FORGOT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= VERIFY OTP ================= */

exports.verifyOTP = async (req, res) => {
  try {
    const { identifier, role, otp } = req.body;

    if (!identifier || !role || !otp)
      return res.status(400).json({ message: "All fields required" });

    const table = getTable(role);
    if (!table)
      return res.status(400).json({ message: "Invalid role" });

    const result = await pool.query(
      `SELECT id, otp_expiry
       FROM ${table}
       WHERE phone=$1 AND otp=$2`,
      [identifier, otp]
    );

    if (result.rowCount === 0)
      return res.status(400).json({ message: "Invalid OTP" });

    const expiry = result.rows[0].otp_expiry;

    if (new Date(expiry) < new Date())
      return res.status(400).json({ message: "OTP expired" });

    res.json({ message: "OTP verified successfully" });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */

exports.resetPassword = async (req, res) => {
  try {
    const { identifier, role, newPassword } = req.body;

    if (!identifier || !role || !newPassword)
      return res.status(400).json({ message: "All fields required" });

    const table = getTable(role);
    if (!table)
      return res.status(400).json({ message: "Invalid role" });

    const hashedPassword = await hashPassword(newPassword);

    await pool.query(
      `UPDATE ${table}
       SET password_hash=$1,
           reset_token=NULL,
           reset_token_expiry=NULL,
           otp=NULL,
           otp_expiry=NULL
       WHERE email=$2 OR phone=$2`,
      [hashedPassword, identifier]
    );

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("RESET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
