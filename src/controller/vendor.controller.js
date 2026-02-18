const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const vendorService = require("../modules/vendor/vendor.service");
const { sendOTP } = require("../utils/twilio");
const { hashPassword } = require("../utils/password.utils");


/* ✅ Register Vendor */
/* ✅ Register Vendor */


exports.registerVendor = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      shop_name,
      owner_name,
      email,
      phone,
      password,
      business_type,
      address,
      latitude,
      longitude,
      opening_time,
      closing_time,
      shop_logo,
      license_doc
    } = req.body;

    if (
      !shop_name ||
      !owner_name ||
      !email ||
      !phone ||
      !password ||
      !business_type
    ) {
      return res.status(400).json({
        message:
          "shop_name, owner_name, email, phone, password, business_type are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    console.log("STEP 1 - Starting registration");

    await client.query("BEGIN");

    console.log("STEP 2 - After BEGIN");

    const existingUser = await client.query(
      `SELECT id FROM users WHERE email = $1 OR phone = $2`,
      [normalizedEmail, normalizedPhone]
    );

    if (existingUser.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Email or phone already registered"
      });
    }

    // 🔐 Hash password using bcrypt directly
    const password_hash = await bcrypt.hash(password, 10);

    console.log("STEP 3 - Password hashed");

    const userResult = await client.query(
      `INSERT INTO users (name, email, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,'vendor')
       RETURNING id`,
      [owner_name, normalizedEmail, normalizedPhone, password_hash]
    );

    const userId = userResult.rows[0].id;

    console.log("STEP 4 - User inserted:", userId);

    await client.query(
      `INSERT INTO vendors
       (user_id, shop_name, owner_name, email, phone, password_hash,
        business_type, address, latitude, longitude,
        opening_time, closing_time, shop_logo, license_doc,
        is_approved, phone_verified)
       VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'pending',false)`,
      [
        userId,
        shop_name,
        owner_name,
        normalizedEmail,
        normalizedPhone,
        password_hash,
        business_type,
        address,
        latitude,
        longitude,
        opening_time,
        closing_time,
        shop_logo,
        license_doc
      ]
    );

    console.log("STEP 5 - Vendor inserted");

    await client.query("COMMIT");

    console.log("STEP 6 - COMMIT DONE");

    await sendOTP(normalizedPhone);

    res.status(201).json({
      message: "Vendor registered successfully. Waiting for admin approval"
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Register Vendor Error:", err);
    res.status(500).json({
      message: "Vendor registration failed"
    });
  } finally {
    client.release();
  }
};







/* ✅ Get Vendor Profile */
exports.getVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const result = await pool.query(
      `SELECT
        id,
        shop_name,
        owner_name,
        email,
        phone,
        business_type,
        address,
        opening_time,
        closing_time,
        latitude,
        longitude,
        shop_logo,
        license_doc,
        created_at
       FROM vendors
       WHERE id = $1`,
      [vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Get Vendor Profile Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ✅ Update Vendor Profile */
exports.updateVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const {
      shop_name,
      owner_name,
      phone,
      address,
      opening_time,
      closing_time
    } = req.body;

    const result = await pool.query(
      `UPDATE vendors
       SET
         shop_name = $1,
         owner_name = $2,
         phone = $3,
         address = $4,
         opening_time = $5,
         closing_time = $6
       WHERE id = $7
       RETURNING
         id,
         shop_name,
         owner_name,
         email,
         phone,
         address,
         opening_time,
         closing_time`,
      [
        shop_name,
        owner_name,
        phone,
        address,
        opening_time,
        closing_time,
        vendorId
      ]
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Update Vendor Profile Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
// controllers/vendor.controller.js


exports.toggleShopStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // 🔒 Check if this user is a vendor
    const vendorCheck = await pool.query(
   "SELECT id, is_online FROM vendors WHERE id = $1",
  [userId]
);
    if (vendorCheck.rowCount === 0) {
      return res.status(403).json({ message: "Vendor not found" });
    }

    const { is_online } = req.body;

    if (typeof is_online !== "boolean") {
      return res.status(400).json({ message: "Invalid toggle value" });
    }

    await pool.query(
      "UPDATE vendors SET is_online = $1 WHERE id = $2",
      [is_online, userId]
    );

    res.json({
      success: true,
      message: is_online
        ? "You are back online"
        : "You are now offline. No new orders will come."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

//VENDOR DASHBOARD FETCH API



