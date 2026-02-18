const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const pool = require("../config/database");
const transporter = require("../config/email");
const { hashPassword, comparePassword } = require("../utils/password.utils");

/* ================= HELPER ================= */

function getTable(role) {
  if (role === "customer") return "app_data.customers";
  if (role === "vendor") return "app_data.vendors";
  if (role === "delivery") return "app_data.delivery_partners";
  return null;
}

/* ================= REGISTER (CUSTOMER EXAMPLE) ================= */

exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password required"
      });
    }

    const existing = await pool.query(
      `SELECT id FROM app_data.customers WHERE email=$1`,
      [email]
    );

    if (existing.rowCount > 0) {
      return res.status(400).json({
        message: "Customer already exists"
      });
    }

    const hashedPassword = await hashPassword(password);

    await pool.query(
      `INSERT INTO app_data.customers
       (name, email, phone, password_hash)
       VALUES ($1,$2,$3,$4)`,
      [name, email, phone ?? null, hashedPassword]
    );

    res.status(201).json({
      message: "Customer registered successfully"
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= LOGIN ================= */

exports.login = async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

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

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      `UPDATE ${table}
       SET reset_token=$1,
           reset_token_expiry=$2
       WHERE email=$3 OR phone=$3`,
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

    res.json({ message: "Reset link sent to email" });

  } catch (error) {
    console.error("FORGOT ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= RESET PASSWORD ================= */

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, role } = req.body;

    const table = getTable(role);
    if (!table)
      return res.status(400).json({ message: "Invalid role" });

    const result = await pool.query(
      `SELECT id, reset_token_expiry
       FROM ${table}
       WHERE reset_token=$1`,
      [token]
    );

    if (result.rowCount === 0)
      return res.status(400).json({ message: "Invalid token" });

    const user = result.rows[0];

    if (new Date(user.reset_token_expiry) < new Date())
      return res.status(400).json({ message: "Token expired" });

    const hashedPassword = await hashPassword(newPassword);

    await pool.query(
      `UPDATE ${table}
       SET password_hash=$1,
           reset_token=NULL,
           reset_token_expiry=NULL
       WHERE id=$2`,
      [hashedPassword, user.id]
    );

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("RESET ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
