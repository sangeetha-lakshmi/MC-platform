const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const vendorService = require("./vendor.service");

/* ✅ Register Vendor */
exports.registerVendor = async (req, res) => {
  try {
    const { owner_name, email, password, business_type } = req.body;

    const password_hash = await bcrypt.hash(password, 10);

    await vendorService.createVendor({
      owner_name,
      email,
      password_hash,
      business_type
    });

    res.json({
      message: "Vendor registered successfully ⏳ Waiting for admin approval"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ✅ Vendor Login */
exports.loginVendor = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find vendor
    const vendor = await vendorService.findVendorByEmail(email);

    if (!vendor) {
      return res.status(400).json({ error: "Vendor not found" });
    }

    // Check approval
    if (!vendor.is_approved) {
      return res.status(403).json({ error: "Admin approval pending ⏳" });
    }

    // Compare password
    const match = await bcrypt.compare(password, vendor.password_hash);

    if (!match) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: vendor.id, role: "vendor" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Vendor login successful ✅",
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
