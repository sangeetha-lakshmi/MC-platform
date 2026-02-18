const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/database"); 
const adminService = require("../modules/admin/admin.service");

/* ================= ADMIN LOGIN ================= */
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
    res.status(401).json({ error: err.message });
  }
};

/* ================= SYSTEM SETTINGS ================= */
const saveSystemSettings = async (req, res) => {
  try {
    const data = await adminService.saveOrUpdateSystemSettings(req.body);

    res.json({
      message: "System settings saved successfully ✅",
      data
    });
  } catch (error) {
    console.error("System Settings Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= PLATFORM SETTINGS ================= */
const savePlatformSettings = async (req, res) => {
  try {
    const data = await adminService.saveOrUpdatePlatformSettings(req.body);

    res.json({
      message: "Platform settings saved successfully ✅",
      data
    });
  } catch (error) {
    console.error("Platform Settings Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET PENDING VENDORS ================= */
const getPendingVendors = async (req, res) => {
  try {
    const vendors = await adminService.getPendingVendors();
    res.json({ pending_vendors: vendors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= APPROVE VENDOR ================= */
const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;
    await adminService.approveVendor(id);
    res.json({ message: "Vendor approved ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= DECLINE VENDOR ================= */
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

/* ================= GET APPROVED VENDORS ================= */
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

/* ================= GET DECLINED VENDORS ================= */
const getDeclinedVendors = async (req, res) => {
  try {
    const vendors = await adminService.getDeclinedVendors();
    res.json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error("Get Declined Vendors Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/* ================= GET ADMIN PROFILE ================= */
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const result = await pool.query(
      "SELECT id, name, email, phone FROM admin_users WHERE id = $1",
      [adminId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Get Profile Error:", err.message);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

/* ================= UPDATE ADMIN PROFILE ================= */
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, email, phone, currentPassword, newPassword } = req.body;

    await pool.query(
      `UPDATE admin_users 
       SET name=$1, email=$2, phone=$3 
       WHERE id=$4`,
      [name, email, phone, adminId]
    );

    if (currentPassword && newPassword) {

      const result = await pool.query(
        "SELECT password_hash FROM admin_users WHERE id=$1",
        [adminId]
      );

      const isMatch = await bcrypt.compare(
        currentPassword,
        result.rows[0].password_hash
      );

      if (!isMatch) {
        return res.status(400).json({ message: "Current password incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(
        "UPDATE admin_users SET password_hash=$1 WHERE id=$2",
        [hashedPassword, adminId]
      );
    }

    res.json({ message: "Profile updated successfully ✅" });

  } catch (err) {
    console.error("Update Profile Error:", err.message);
    res.status(500).json({ message: "Update Failed" });
  }
};

/* ================= CATEGORY COUNT ================= */
const getCategoryCount = async (req, res) => {
  try {
    const data = await adminService.getCategoryCount();
    res.json(data);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET SHOPS ================= */
const getShops = async (req, res) => {
  try {
    const { category } = req.query;
    const shops = await adminService.getShops(category);
    res.json(shops);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET SINGLE SHOP ================= */
const getShopById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        v.id,
        v.shop_name,
        v.email,
        v.business_type AS category,
        c.id AS category_id
      FROM vendors v
      LEFT JOIN app_data.categories c
        ON c.name = v.business_type
      WHERE v.id = $1
      `,
      [id]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error("Get Shop Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET SHOP PRODUCTS ================= */
const getShopProducts = async (req, res) => {
  try {
    const products = await adminService.getShopProducts(req.params.id);
    res.json(products);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= TOGGLE PRODUCT ================= */
const toggleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedProduct = await adminService.toggleProduct(id);

    res.json({
      message: "Product status updated successfully ✅",
      data: updatedProduct
    });

  } catch (err) {
    console.error("Toggle Product Error:", err.message);
    res.status(400).json({ error: err.message });
  }
};

/* ================= EXPORTS ================= */
module.exports = {
  adminLogin,
  saveSystemSettings,
  savePlatformSettings,   // ✅ ADDED
  getPendingVendors,
  approveVendor,
  declineVendor,
  getApprovedVendors,
  getDeclinedVendors,
  getAdminProfile,
  updateAdminProfile,
  getCategoryCount,
  getShops,
  getShopById,
  getShopProducts,
  toggleProduct
};
