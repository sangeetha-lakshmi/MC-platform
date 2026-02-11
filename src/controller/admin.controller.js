const jwt = require("jsonwebtoken");
const adminService = require("../modules/admin/admin.service");

/* ✅ Admin Login */
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

/* ✅ Change Admin Password */
const changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    await adminService.changePassword(
      adminId,
      currentPassword,
      newPassword
    );

    res.json({ message: "Password changed successfully ✅" });
  } catch (error) {
    console.error("Change Password Error:", error.message);
    res.status(400).json({ error: error.message });
  }
};


// 1️⃣ Category Count
const getCategoryCount = async (req, res) => {
  try {
    const data = await adminService.getCategoryCount();
    res.json(data);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// 2️⃣ Get Shops
const getShops = async (req, res) => {
  try {
    const { category } = req.query;
    const shops = await adminService.getShops(category);
    res.json(shops);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// 3️⃣ Get Single Shop
const getShopById = async (req, res) => {
  try {
    const shop = await adminService.getShopById(req.params.id);
    res.json(shop);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// 4️⃣ Get Shop Products
const getShopProducts = async (req, res) => {
  try {
    const products = await adminService.getShopProducts(req.params.id);
    res.json(products);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// 5️⃣ Toggle Product
const toggleProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedProduct = await adminService.toggleProduct(id);

    res.json({
      message: "Product status updated successfully",
      data: updatedProduct
    });

  } catch (err) {
    console.error("Toggle Product Error:", err.message);
    res.status(400).json({ error: err.message });
  }
};


module.exports = {
adminLogin,
  getPendingVendors,
  approveVendor,
  declineVendor,
  getApprovedVendors,
  changeAdminPassword,
  getCategoryCount,
  getShops,
  getShopById,
  getShopProducts,
  toggleProduct
};