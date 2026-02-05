const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller.js");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
// ✅ Check what is imported
console.log("Admin Controller Loaded:", adminController);

// Routes
router.post("/login", adminController.adminLogin);

router.get("/pending", adminController.getPendingVendors);

router.put("/approve/:id", adminController.approveVendor);
router.put(
  "/vendors/:vendorId/decline",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.declineVendor
);
router.get(
  "/vendors/approved",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getApprovedVendors
);
console.log("Admin Controller Loaded:", Object.keys(adminController));

module.exports = router;
