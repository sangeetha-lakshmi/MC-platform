const pool = require("../config/db");
const bcrypt = require("bcrypt");

// ✅ Restaurant Apply/Register
exports.registerRestaurant = async (req, res) => {
  try {
    const {
      restaurant_name,
      owner_name,
      email,
      phone,
      password,
      address,
      city,
      fssai_license,
    } = req.body;

    // ✅ Validation (Mandatory check)
    if (
      !restaurant_name ||
      !owner_name ||
      !email ||
      !phone ||
      !password ||
      !address ||
      !city ||
      !fssai_license
    ) {
      return res.status(400).json({
        message: "All required fields must be filled ❌",
      });
    }

    // Check existing
    const existing = await pool.query(
      "SELECT * FROM restaurants WHERE email=$1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Restaurant already registered ❌",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert restaurant (approval pending)
    await pool.query(
      `INSERT INTO restaurants
      (restaurant_name, owner_name, email, phone, password, address, city, fssai_license)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        restaurant_name,
        owner_name,
        email,
        phone,
        hashedPassword,
        address,
        city,
        fssai_license,
      ]
    );

    res.status(201).json({
      message:
        "Restaurant registered successfully ✅ Waiting for admin approval ⏳",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const jwt = require("jsonwebtoken");

exports.loginRestaurant = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM restaurants WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Restaurant not found ❌" });
    }

    const restaurant = result.rows[0];

    // 🔥 Approval Check
    if (!restaurant.is_approved) {
      return res.status(403).json({
        message: "Restaurant not approved by admin yet ⏳",
      });
    }

    // Password check
    const match = await bcrypt.compare(password, restaurant.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid password ❌" });
    }

    // Token
    const token = jwt.sign(
      { id: restaurant.id, role: "restaurant" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful ✅",
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
