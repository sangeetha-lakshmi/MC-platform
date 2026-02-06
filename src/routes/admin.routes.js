const express = require("express");
const router = express.Router();

<<<<<<< HEAD
const adminController = require("../controller/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");
=======
const adminController = require("../controller/admin.controller.js");
const authMiddleware = require("../middlewares/auth.middleware");
const roleMiddleware = require("../middlewares/role.middleware");
>>>>>>> 575455205a6ee4f66a67e54fc2ec7523fb393172
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

router.put("/change-password",authMiddleware,adminController.changeAdminPassword);

module.exports = router;
