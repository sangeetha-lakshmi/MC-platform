const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");



// ✅ Admin login (public)
router.post("/login", adminController.adminLogin);

router.use(authMiddleware);
// 🔐 Protected routes
router.get(
  "/pending",
  authMiddleware,
  adminController.getPendingVendors
);

router.put(
  "/approve/:id",
  authMiddleware,
  adminController.approveVendor
);

router.put(
  "/vendors/:vendorId/decline",
  authMiddleware,
  adminController.declineVendor
);

router.get(
  "/vendors/approved",
  authMiddleware,
  adminController.getApprovedVendors
);

router.put(
  "/change-password",
  authMiddleware,
  adminController.changeAdminPassword
);
router.get("/category-count", adminController.getCategoryCount);
router.get("/shops", adminController.getShops);
router.get("/shops/:id", adminController.getShopById);
router.get("/shops/:id/products", adminController.getShopProducts);
router.patch("/products/:id/toggle", adminController.toggleProduct);
router.get("/vendors/declined", adminController.getDeclinedVendors);


// debug
console.log("Admin Controller Loaded:", Object.keys(adminController));

module.exports = router;
