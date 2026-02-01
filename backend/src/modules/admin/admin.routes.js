const express = require("express");
const router = express.Router();

const adminController = require("./admin.controller");

// ✅ Check what is imported
console.log("Admin Controller Loaded:", adminController);

// Routes
router.post("/login", adminController.adminLogin);

router.get("/pending", adminController.getPendingVendors);

router.put("/approve/:id", adminController.approveVendor);

module.exports = router;
