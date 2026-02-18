const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// ✅ Public Route
router.post("/login", adminController.adminLogin);

// 🔐 All routes below require auth
router.use(authMiddleware);

// ================= SYSTEM SETTINGS =================
router.post("/system-settings", adminController.saveSystemSettings);
// ================= platform settings=================
router.post("/platform-settings", adminController.savePlatformSettings);

// ================= VENDORS =================
router.get("/pending", adminController.getPendingVendors);
router.put("/approve/:id", adminController.approveVendor);
router.put("/vendors/:vendorId/decline", adminController.declineVendor);
router.get("/vendors/approved", adminController.getApprovedVendors);
router.get("/vendors/declined", adminController.getDeclinedVendors);

// ================= PROFILE =================
router.get("/profile", adminController.getAdminProfile);
router.put("/profile", adminController.updateAdminProfile);

// ================= SHOPS =================
router.get("/shops", adminController.getShops);
router.get("/shops/:id", adminController.getShopById);
router.get("/shops/:id/products", adminController.getShopProducts);

// ================= PRODUCTS =================
router.patch("/products/:id/toggle", adminController.toggleProduct);

// ================= DASHBOARD =================
router.get("/category-count", adminController.getCategoryCount);

// Debug
console.log("Admin Controller Loaded:", Object.keys(adminController));

module.exports = router;
