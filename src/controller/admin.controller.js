const jwt = require("jsonwebtoken");
const adminService = require("../modules/admin/admin.service");

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const admin = await adminService.loginAdmin(req.body);

    const token = jwt.sign(
      { id: admin.id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: err });
  }
};

// Pending Vendors
const getPendingVendors = async (req, res) => {
  try {
    const vendors = await adminService.getPendingVendors();
    res.json({ pending_vendors: vendors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Approve Vendor
const approveVendor = async (req, res) => {
  try {
    await adminService.approveVendor(req.params.id);
    res.json({ message: "Vendor approved " });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  adminLogin,
  getPendingVendors,
  approveVendor,
};
/* everything correct */