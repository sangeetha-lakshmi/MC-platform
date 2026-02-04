const express = require("express");
const router = express.Router();

const vendorController = require("../controller/vendor.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const vendorApproved = require("../middlewares/vendorApproved.middleware");

// existing
router.post("/register", vendorController.registerVendor);
router.post("/login", vendorController.loginVendor);

// 🆕 profile routes
router.get(
  "/profile",
  authMiddleware,
  vendorApproved,
  vendorController.getVendorProfile
);

router.put(
  "/profile",
  authMiddleware,
  vendorApproved,
  vendorController.updateVendorProfile
);

module.exports = router;
