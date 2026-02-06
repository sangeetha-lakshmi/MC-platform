const jwt = require("jsonwebtoken");
const adminService = require("../modules/admin/admin.service");

/* ✅ Admin Login */
const adminLogin = async (req, res) => {
  try {
    const admin = await adminService.loginAdmin(req.body);

    const token = jwt.sign(
      { id: admin.id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

/* ✅ Get Pending Vendors */
const getPendingVendors = async (req, res) => {
  try {
    const vendors = await adminService.getPendingVendors();
    res.json({ pending_vendors: vendors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ✅ Approve Vendor */
const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.approveVendor(id);
    res.json({ message: "Vendor approved ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ❌ Decline Vendor */
const declineVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    await adminService.declineVendor(vendorId);

    res.json({
      message: "Vendor declined successfully ❌"
    });
  } catch (error) {
    console.error("Decline Vendor Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* ✅ Get Approved Vendors */
const getApprovedVendors = async (req, res) => {
  try {
    const vendors = await adminService.getApprovedVendors();

    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error("Get Approved Vendors Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  adminLogin,
  getPendingVendors,
  approveVendor,
  declineVendor,
  getApprovedVendors
};
