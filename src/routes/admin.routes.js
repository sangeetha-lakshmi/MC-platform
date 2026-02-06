const express = require("express");
const router = express.Router();

const adminController = require("../controller/admin.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// check import
console.log("Admin Controller Loaded:", adminController);

// Routes
router.post("/login", adminController.adminLogin);

router.get("/pending", adminController.getPendingVendors);

router.put("/approve/:id", adminController.approveVendor);

router.put(
  "/change-password",
  authMiddleware,
  adminController.changeAdminPassword
);

module.exports = router;
