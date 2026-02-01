const express = require("express");
const router = express.Router();

const vendorController = require("./vendor.controller");

// ✅ Register Vendor
router.post("/register", vendorController.registerVendor);

// ✅ Vendor Login
router.post("/login", vendorController.loginVendor);

module.exports = router;
