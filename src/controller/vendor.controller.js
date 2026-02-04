const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");
const vendorService = require("../modules/vendor/vendor.service");

/* ✅ Register Vendor */
exports.registerVendor = async (req, res) => {
  try {
    const {
      shop_name,
      owner_name,
      email,
      phone,
      password,
      business_type,
      address,
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
        error:
          "shop_name, owner_name, email, phone, password, business_type are required"
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await vendorService.createVendor({
      shop_name,
      owner_name,
      email,
      phone,
      password_hash,
      business_type,
      address,
      opening_time,
      closing_time,
      shop_logo,
      license_doc
    });

    res.status(201).json({
      message: "Vendor registered successfully. Waiting for admin approval"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ✅ Vendor Login */
exports.loginVendor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const vendor = await vendorService.findVendorByEmail(email);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (!vendor.is_approved) {
      return res.status(403).json({
        error: "Admin approval pending"
      });
    }

    const match = await bcrypt.compare(password, vendor.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: vendor.id, role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Vendor login successful",
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
