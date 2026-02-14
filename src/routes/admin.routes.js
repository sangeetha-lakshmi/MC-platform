const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// ✅ Public Route
router.post("/login", adminController.adminLogin);

// 🔐 All routes below require auth
router.use(authMiddleware);

// Vendors
router.get("/pending", adminController.getPendingVendors);
router.put("/approve/:id", adminController.approveVendor);
router.put("/vendors/:vendorId/decline", adminController.declineVendor);
router.get("/vendors/approved", adminController.getApprovedVendors);
router.get("/vendors/declined", adminController.getDeclinedVendors);

// Profile
router.get("/profile", adminController.getAdminProfile);
router.put("/profile", adminController.updateAdminProfile);


// Shops
router.get("/shops", adminController.getShops);
router.get("/shops/:id", adminController.getShopById);
router.get("/shops/:id/products", adminController.getShopProducts);

// Products
router.patch("/products/:id/toggle", adminController.toggleProduct);

// Dashboard
router.get("/category-count", adminController.getCategoryCount);

// Debug
console.log("Admin Controller Loaded:", Object.keys(adminController));

module.exports = router;

